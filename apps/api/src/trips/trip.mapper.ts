import { Trip, User, Vehicle } from '@prisma/client';
import { toVehicleDto } from '../vehicles/vehicle.mapper';
import { TripDto } from './dto/trip.dto';

export type TripWithRelations = Trip & { driver: User; vehicle: Vehicle };

export const TRIP_INCLUDE = { driver: true, vehicle: true } as const;

/** @param showDriverPhone chỉ true khi người xem có quyền (khách đã đặt, admin, chính tài xế) */
export function toTripDto(t: TripWithRelations, showDriverPhone = false): TripDto {
  return {
    id: t.id,
    origin: { address: t.originAddress, lat: t.originLat, lng: t.originLng },
    destination: { address: t.destAddress, lat: t.destLat, lng: t.destLng },
    departureTime: t.departureTime,
    pricePerSeat: t.pricePerSeat,
    totalSeats: t.totalSeats,
    availableSeats: t.availableSeats,
    status: t.status,
    note: t.note,
    driver: {
      id: t.driver.id,
      fullName: t.driver.fullName,
      ...(showDriverPhone ? { phone: t.driver.phone } : {}),
    },
    vehicle: toVehicleDto(t.vehicle),
    bookedSeats: t.totalSeats - t.availableSeats,
    createdAt: t.createdAt,
  };
}
