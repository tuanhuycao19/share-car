import { DriverProfile, User } from '@prisma/client';
import { DriverProfileDto, UserDto } from './user.dto';

export function toDriverProfileDto(p: DriverProfile): DriverProfileDto {
  return {
    id: p.id,
    licenseNumber: p.licenseNumber,
    status: p.status,
    rejectReason: p.rejectReason,
    reviewedAt: p.reviewedAt,
    createdAt: p.createdAt,
  };
}

export function toUserDto(u: User & { driverProfile?: DriverProfile | null }): UserDto {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.fullName,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    driverProfile: u.driverProfile ? toDriverProfileDto(u.driverProfile) : null,
  };
}
