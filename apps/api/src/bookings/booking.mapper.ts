import { Booking, User } from '@prisma/client';
import { toTripDto, TripWithRelations } from '../trips/trip.mapper';
import { BookingDto } from './dto/booking.dto';

export function toBookingDto(
  b: Booking & { passenger?: User; trip?: TripWithRelations },
  opts: { showPassengerPhone?: boolean; showDriverPhone?: boolean } = {},
): BookingDto {
  return {
    id: b.id,
    tripId: b.tripId,
    seats: b.seats,
    pricePerSeat: b.pricePerSeat,
    totalPrice: b.totalPrice,
    pickup: { address: b.pickupAddress, lat: b.pickupLat, lng: b.pickupLng },
    dropoff: { address: b.dropoffAddress, lat: b.dropoffLat, lng: b.dropoffLng },
    note: b.note,
    status: b.status,
    cancelReason: b.cancelReason,
    cancelledAt: b.cancelledAt,
    createdAt: b.createdAt,
    passenger: b.passenger
      ? {
          id: b.passenger.id,
          fullName: b.passenger.fullName,
          ...(opts.showPassengerPhone ? { phone: b.passenger.phone } : {}),
        }
      : undefined,
    trip: b.trip ? toTripDto(b.trip, opts.showDriverPhone) : undefined,
  };
}
