import type { BookingStatus, DriverStatus, Role, TripStatus, VehicleType } from '@share-car/api-client';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'muted' | 'destructive';

export const ROLE_LABEL: Record<Role, string> = {
  PASSENGER: 'Hành khách',
  DRIVER: 'Tài xế',
  ADMIN: 'Quản trị viên',
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  SEATS_5: 'Xe 5 chỗ',
  SEATS_7: 'Xe 7 chỗ',
};

export const TRIP_STATUS: Record<TripStatus, { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: 'Sắp khởi hành', variant: 'info' },
  ONGOING: { label: 'Đang chạy', variant: 'warning' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'muted' },
};

export const BOOKING_STATUS: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'muted' },
  REJECTED: { label: 'Bị từ chối', variant: 'destructive' },
  COMPLETED: { label: 'Hoàn thành', variant: 'info' },
};

export const DRIVER_STATUS: Record<DriverStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Bị từ chối', variant: 'destructive' },
};

/** Trang chủ theo role sau khi đăng nhập */
export const ROLE_HOME: Record<Role, string> = {
  PASSENGER: '/',
  DRIVER: '/driver',
  ADMIN: '/admin',
};
