import { VehicleType } from '@prisma/client';

/** Sức chứa hành khách tối đa theo loại xe (không tính tài xế). */
export const PASSENGER_CAPACITY: Record<VehicleType, number> = {
  SEATS_5: 4,
  SEATS_7: 6,
};

export function passengerCapacity(type: VehicleType): number {
  return PASSENGER_CAPACITY[type];
}
