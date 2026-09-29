import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TripDto } from '../trips/dto/trip.dto';
import { AdminService } from './admin.service';
import {
  AdminCancelTripDto,
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

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Số liệu tổng quan */
  @Get('stats')
  stats(): Promise<AdminStatsDto> {
    return this.admin.stats();
  }

  /** Danh sách người dùng */
  @Get('users')
  users(@Query() q: AdminUserQueryDto): Promise<PaginatedUsersDto> {
    return this.admin.listUsers(q);
  }

  /** Khóa / mở khóa người dùng */
  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<AdminUserDto> {
    return this.admin.updateUserStatus(admin, id, dto);
  }

  /** Danh sách tài xế (lọc theo trạng thái duyệt) */
  @Get('drivers')
  drivers(@Query() q: AdminDriverQueryDto): Promise<PaginatedUsersDto> {
    return this.admin.listDrivers(q);
  }

  /** Duyệt tài xế */
  @Post('drivers/:userId/approve')
  @HttpCode(200)
  approve(
    @CurrentUser() admin: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ReviewDriverDto,
  ): Promise<AdminUserDto> {
    return this.admin.reviewDriver(admin, userId, 'APPROVED', dto);
  }

  /** Từ chối tài xế */
  @Post('drivers/:userId/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ReviewDriverDto,
  ): Promise<AdminUserDto> {
    return this.admin.reviewDriver(admin, userId, 'REJECTED', dto);
  }

  /** Danh sách chuyến */
  @Get('trips')
  trips(@Query() q: AdminTripQueryDto): Promise<PaginatedTripsDto> {
    return this.admin.listTrips(q);
  }

  /** Hủy chuyến (hủy luôn các vé đang hiệu lực) */
  @Post('trips/:id/cancel')
  @HttpCode(200)
  cancelTrip(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminCancelTripDto): Promise<TripDto> {
    return this.admin.cancelTrip(id, dto.reason);
  }
}
