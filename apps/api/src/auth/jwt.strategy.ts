import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload } from '../common/auth-user';
import { APP_ENV, AppEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(APP_ENV) env: AppEnv,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwtSecret,
    });
  }

  /** Tải lại user mỗi request để phản ánh ngay việc khóa tài khoản / đổi role. */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đã bị khóa');
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
  }
}
