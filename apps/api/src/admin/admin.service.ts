import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../common/auth-user';
import { toSkipTake } from '../common/utils/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { toTripDto, TRIP_INCLUDE } from '../trips/trip.mapper';
import { TripsService } from '../trips/trips.service';
import { toUserDto } from '../users/user.mapper';
import {
  AdminDriverQueryDto,
  AdminStatsDto,
  AdminTripQueryDto,
  AdminUserDto,
  AdminUserQueryDto,
  PaginatedTripsDto,
  PaginatedUsersDto,
  ReviewDriverDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

const USER_INCLUDE = { driverProfile: true, _count: { select: { vehicles: true } } } as const;
type UserWithCounts = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

function toAdminUserDto(u: UserWithCounts): AdminUserDto {
  return { ...toUserDto(u), vehicleCount: u._count.vehicles };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trips: TripsService,
  ) {}

  async stats(): Promise<AdminStatsDto> {
    const [totalUsers, totalPassengers, totalDrivers, pendingDrivers, scheduledTrips, confirmedBookings] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'PASSENGER' } }),
        this.prisma.user.count({ where: { role: 'DRIVER' } }),
        this.prisma.driverProfile.count({ where: { status: 'PENDING' } }),
        this.prisma.trip.count({ where: { status: 'SCHEDULED' } }),
        this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      ]);
    return { totalUsers, totalPassengers, totalDrivers, pendingDrivers, scheduledTrips, confirmedBookings };
  }

  async listUsers(q: AdminUserQueryDto): Promise<PaginatedUsersDto> {
    const { skip, take, page, pageSize } = toSkipTake(q);
    const search = q.q?.trim();
    const where: Prisma.UserWhereInput = {
      role: q.role,
      status: q.status,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, include: USER_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map(toAdminUserDto), total, page, pageSize };
  }

  async listDrivers(q: AdminDriverQueryDto): Promise<PaginatedUsersDto> {
    const { skip, take, page, pageSize } = toSkipTake(q);
    const where: Prisma.UserWhereInput = {
      role: 'DRIVER',
      driverProfile: q.status ? { status: q.status } : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, include: USER_INCLUDE, orderBy: { createdAt: 'asc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map(toAdminUserDto), total, page, pageSize };
  }

  async reviewDriver(
    admin: AuthUser,
    userId: string,
    decision: 'APPROVED' | 'REJECTED',
    dto: ReviewDriverDto,
  ): Promise<AdminUserDto> {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ tài xế');
    if (decision === 'REJECTED' && !dto.reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }
    await this.prisma.driverProfile.update({
      where: { userId },
      data: {
        status: decision,
        rejectReason: decision === 'REJECTED' ? dto.reason!.trim() : null,
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });
    return this.getUser(userId);
  }

  async updateUserStatus(admin: AuthUser, userId: string, dto: UpdateUserStatusDto): Promise<AdminUserDto> {
    if (userId === admin.id) throw new BadRequestException('Không thể tự khóa tài khoản của mình');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (user.role === 'ADMIN') throw new BadRequestException('Không thể khóa tài khoản admin khác');
    await this.prisma.user.update({ where: { id: userId }, data: { status: dto.status } });
    return this.getUser(userId);
  }

  async listTrips(q: AdminTripQueryDto): Promise<PaginatedTripsDto> {
    const { skip, take, page, pageSize } = toSkipTake(q);
    const where: Prisma.TripWhereInput = { status: q.status };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({ where, include: TRIP_INCLUDE, orderBy: { departureTime: 'desc' }, skip, take }),
      this.prisma.trip.count({ where }),
    ]);
    return { items: items.map((t) => toTripDto(t, true)), total, page, pageSize };
  }

  async cancelTrip(tripId: string, reason?: string) {
    const exists = await this.prisma.trip.count({ where: { id: tripId } });
    if (!exists) throw new NotFoundException('Không tìm thấy chuyến');
    await this.trips.cancelTrip(tripId, reason?.trim() || 'Quản trị viên hủy chuyến');
    return this.trips.getById(tripId, true);
  }

  private async getUser(userId: string): Promise<AdminUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: USER_INCLUDE });
    return toAdminUserDto(user);
  }
}
