import { Vehicle } from '@prisma/client';
import { passengerCapacity } from '../common/utils/seats';
import { VehicleDto } from './dto/vehicle.dto';

export function toVehicleDto(v: Vehicle): VehicleDto {
  return {
    id: v.id,
    plateNumber: v.plateNumber,
    brand: v.brand,
    model: v.model,
    color: v.color,
    type: v.type,
    passengerCapacity: passengerCapacity(v.type),
    isActive: v.isActive,
    createdAt: v.createdAt,
  };
}
