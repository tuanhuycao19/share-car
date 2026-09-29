import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from '../common/auth-user';
import { APP_ENV, AppEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { toUserDto } from '../users/user.mapper';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    @Inject(APP_ENV) private readonly env: AppEnv,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          fullName: dto.fullName,
          passwordHash,
          role: dto.role,
          // Tài xế mới đăng ký ở trạng thái PENDING, chờ admin duyệt
          driverProfile:
            dto.role === 'DRIVER' ? { create: { licenseNumber: dto.licenseNumber! } } : undefined,
        },
        include: { driverProfile: true },
      });
      return { accessToken: await this.sign(user.id, user.role), user: toUserDto(user) };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = String((e.meta?.target as string[] | undefined)?.join(',') ?? '');
        if (target.includes('email')) throw new ConflictException('Email đã được sử dụng');
        if (target.includes('phone')) throw new ConflictException('Số điện thoại đã được sử dụng');
        if (target.includes('license')) throw new ConflictException('Số GPLX đã được đăng ký');
        throw new ConflictException('Thông tin đã tồn tại');
      }
      throw e;
    }
  }

  async login(dto: LoginDto, ip: string): Promise<AuthResponseDto> {
    const key = `login-attempts:${dto.email}:${ip}`;
    const attempts = await this.redis.get(key);
    if (attempts !== null && Number(attempts) >= this.env.loginMaxAttempts) {
      throw new HttpException(
        'Bạn đã đăng nhập sai quá nhiều lần, vui lòng thử lại sau',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { driverProfile: true },
    });
    const ok = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !ok) {
      await this.redis.incrWithTtl(key, this.env.loginWindowSeconds);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đã bị khóa');

    await this.redis.del(key);
    return { accessToken: await this.sign(user.id, user.role), user: toUserDto(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { driverProfile: true },
    });
    return toUserDto(user);
  }

  private sign(sub: string, role: JwtPayload['role']) {
    const payload: JwtPayload = { sub, role };
    return this.jwt.signAsync(payload);
  }
}
