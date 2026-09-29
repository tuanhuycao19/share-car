import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus, Role, UserStatus } from '@prisma/client';

export class DriverProfileDto {
  id: string;
  licenseNumber: string;
  @ApiProperty({ enum: DriverStatus, enumName: 'DriverStatus' })
  status: DriverStatus;
  rejectReason?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

export class UserDto {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  @ApiProperty({ enum: Role, enumName: 'Role' })
  role: Role;
  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  status: UserStatus;
  createdAt: Date;
  /** Chỉ có với tài xế */
  driverProfile?: DriverProfileDto | null;
}

/** Thông tin rút gọn để hiển thị (tài xế, hành khách) */
export class UserSummaryDto {
  id: string;
  fullName: string;
  /** Chỉ trả về khi người xem có quyền (vd: tài xế xem khách đã đặt, khách xem tài xế của chuyến đã đặt) */
  phone?: string;
}
