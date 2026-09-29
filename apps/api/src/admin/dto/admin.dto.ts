import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus, Role, TripStatus, UserStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/utils/pagination.dto';
import { TripDto } from '../../trips/dto/trip.dto';
import { UserDto } from '../../users/user.dto';

const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class AdminStatsDto {
  totalUsers: number;
  totalPassengers: number;
  totalDrivers: number;
  pendingDrivers: number;
  scheduledTrips: number;
  confirmedBookings: number;
}

export class AdminUserQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: Role, enumName: 'Role', required: false })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus', required: false })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(Object.values(UserStatus))
  status?: UserStatus;

  /** Tìm theo tên, email hoặc SĐT */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class AdminDriverQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: DriverStatus, enumName: 'DriverStatus', required: false })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(Object.values(DriverStatus))
  status?: DriverStatus;
}

export class AdminTripQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: TripStatus, enumName: 'TripStatus', required: false })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(Object.values(TripStatus))
  status?: TripStatus;
}

export class ReviewDriverDto {
  /** Lý do (bắt buộc khi từ chối) */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @IsIn(Object.values(UserStatus))
  status: UserStatus;
}

export class AdminCancelTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class AdminUserDto extends UserDto {
  vehicleCount: number;
}

export class PaginatedUsersDto {
  items: AdminUserDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class PaginatedTripsDto {
  items: TripDto[];
  total: number;
  page: number;
  pageSize: number;
}
