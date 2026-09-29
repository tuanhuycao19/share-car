import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TripStatus } from '@prisma/client';
import { AuthUser } from '../common/auth-user';
import { passengerCapacity } from '../common/utils/seats';
import { addMinutes, vnDateTime } from '../common/utils/time';
import { APP_ENV, AppEnv } from '../config/env';
import { EngineService } from '../engine/engine.service';
import { haversineKm, MAPS_PROVIDER, MapsProvider } from '../maps/maps.provider';
import { PrismaService } from '../prisma/prisma.service';
import { toBookingDto } from '../bookings/booking.mapper';
import { BookingDto } from '../bookings/dto/booking.dto';
import {
  CreateTripDto,
  SearchTripsQueryDto,
  SearchTripsResponseDto,
  TripDto,
  TripQueryDto,
  UpdateTripDto,
  UpdateTripStatusDto,
} from './dto/trip.dto';
import { toTripDto, TRIP_INCLUDE } from './trip.mapper';

/** Tài xế phải đăng chuyến trước giờ khởi hành ít nhất N phút */
const MIN_LEAD_MINUTES = 30;
/** Không cho một tài xế có 2 chuyến khởi hành cách nhau dưới N phút */
const DRIVER_TRIP_GAP_MINUTES = 60;
/** Cửa sổ thời gian quanh giờ mong muốn khi tìm chuyến */
const SEARCH_WINDOW_MINUTES = 180;
const MAX_CANDIDATES = 200;

/** Chuyển trạng thái hợp lệ của chuyến */
const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  SCHEDULED: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: EngineService,
    @Inject(MAPS_PROVIDER) private readonly maps: MapsProvider,
    @Inject(APP_ENV) private readonly env: AppEnv,
  ) {}

  // ---------------------------------------------------------------- Tài xế

  async create(driver: AuthUser, dto: CreateTripDto): Promise<TripDto> {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId: driver.id } });
    if (profile?.status !== 'APPROVED') {
      throw new ForbiddenException('Tài khoản tài xế chưa được admin duyệt');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, driverId: driver.id },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');
    if (!vehicle.isActive) throw new BadRequestException('Xe đang ngừng sử dụng');

    const capacity = passengerCapacity(vehicle.type);
    if (dto.totalSeats > capacity) {
      throw new BadRequestException(
        `Xe ${vehicle.type === 'SEATS_5' ? '5' : '7'} chỗ chỉ nhận tối đa ${capacity} ghế khách`,
      );
    }
    if (dto.pricePerSeat % 1000 !== 0) {
      throw new BadRequestException('Giá mỗi ghế phải là bội số của 1.000đ');
    }
    if (haversineKm(dto.origin, dto.destination) < 1) {
      throw new BadRequestException('Điểm đi và điểm đến quá gần nhau');
    }

    const departureTime = new Date(dto.departureTime);
    if (departureTime < addMinutes(new Date(), MIN_LEAD_MINUTES)) {
      throw new BadRequestException(
        `Giờ khởi hành phải sau thời điểm hiện tại ít nhất ${MIN_LEAD_MINUTES} phút`,
      );
    }

    const overlapping = await this.prisma.trip.count({
      where: {
        driverId: driver.id,
        status: { in: ['SCHEDULED', 'ONGOING'] },
        departureTime: {
          gt: addMinutes(departureTime, -DRIVER_TRIP_GAP_MINUTES),
          lt: addMinutes(departureTime, DRIVER_TRIP_GAP_MINUTES),
        },
      },
    });
    if (overlapping > 0) {
      throw new ConflictException('Bạn đã có chuyến khác trong khoảng thời gian này');
    }

    const trip = await this.prisma.trip.create({
      data: {
        driverId: driver.id,
        vehicleId: vehicle.id,
        originAddress: dto.origin.address,
        originLat: dto.origin.lat,
        originLng: dto.origin.lng,
        destAddress: dto.destination.address,
        destLat: dto.destination.lat,
        destLng: dto.destination.lng,
        departureTime,
        pricePerSeat: dto.pricePerSeat,
        totalSeats: dto.totalSeats,
        availableSeats: dto.totalSeats,
        note: dto.note,
      },
      include: TRIP_INCLUDE,
    });
    return toTripDto(trip, true);
  }

  async listForDriver(driverId: string, query: TripQueryDto): Promise<TripDto[]> {
    const trips = await this.prisma.trip.findMany({
      where: { driverId, status: query.status },
      include: TRIP_INCLUDE,
      orderBy: { departureTime: 'desc' },
      take: 100,
    });
    return trips.map((t) => toTripDto(t, true));
  }

  async update(driverId: string, tripId: string, dto: UpdateTripDto): Promise<TripDto> {
    const trip = await this.getOwnedTrip(driverId, tripId);
    if (trip.status !== 'SCHEDULED') throw new BadRequestException('Chỉ sửa được chuyến chưa khởi hành');
    if (dto.pricePerSeat !== undefined) {
      if (dto.pricePerSeat % 1000 !== 0) {
        throw new BadRequestException('Giá mỗi ghế phải là bội số của 1.000đ');
      }
      if (trip.availableSeats !== trip.totalSeats) {
        throw new BadRequestException('Không thể đổi giá khi đã có khách đặt');
      }
    }
    // Điều kiện availableSeats = totalSeats trong WHERE chống race với booking mới
    const result = await this.prisma.trip.updateMany({
      where: {
        id: tripId,
        status: 'SCHEDULED',
        ...(dto.pricePerSeat !== undefined ? { availableSeats: trip.totalSeats } : {}),
      },
      data: { pricePerSeat: dto.pricePerSeat, note: dto.note },
    });
    if (result.count === 0) throw new ConflictException('Chuyến vừa thay đổi, vui lòng thử lại');
    return this.getById(tripId, true);
  }

  async changeStatus(driverId: string, tripId: string, dto: UpdateTripStatusDto): Promise<TripDto> {
    const trip = await this.getOwnedTrip(driverId, tripId);
    if (!TRIP_TRANSITIONS[trip.status].includes(dto.status)) {
      throw new BadRequestException(`Không thể chuyển trạng thái từ ${trip.status} sang ${dto.status}`);
    }
    if (dto.status === 'CANCELLED') {
      await this.cancelTrip(tripId, dto.reason ?? 'Tài xế hủy chuyến');
    } else {
      await this.prisma.$transaction(async (tx) => {
        const res = await tx.trip.updateMany({
          where: { id: tripId, status: trip.status },
          data: { status: dto.status },
        });
        if (res.count === 0) throw new ConflictException('Chuyến vừa thay đổi, vui lòng thử lại');
        if (dto.status === 'COMPLETED') {
          await tx.booking.updateMany({
            where: { tripId, status: 'CONFIRMED' },
            data: { status: 'COMPLETED' },
          });
        }
      });
    }
    return this.getById(tripId, true);
  }

  /** Hủy chuyến và hủy toàn bộ booking đang hiệu lực (dùng chung cho tài xế & admin). */
  async cancelTrip(tripId: string, reason: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.trip.updateMany({
        where: { id: tripId, status: { in: ['SCHEDULED', 'ONGOING'] } },
        data: { status: 'CANCELLED' },
      });
      if (res.count === 0) throw new BadRequestException('Chuyến đã kết thúc hoặc đã hủy');
      await tx.booking.updateMany({
        where: { tripId, status: 'CONFIRMED' },
        data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() },
      });
    });
  }

  async listBookingsForDriver(driverId: string, tripId: string): Promise<BookingDto[]> {
    await this.getOwnedTrip(driverId, tripId);
    const bookings = await this.prisma.booking.findMany({
      where: { tripId },
      include: { passenger: true },
      orderBy: { createdAt: 'asc' },
    });
    return bookings.map((b) => toBookingDto(b, { showPassengerPhone: true }));
  }

  // ---------------------------------------------------------------- Công khai

  async getById(tripId: string, showDriverPhone = false): Promise<TripDto> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, include: TRIP_INCLUDE });
    if (!trip) throw new NotFoundException('Không tìm thấy chuyến');
    return toTripDto(trip, showDriverPhone);
  }

  /**
   * Tìm chuyến:
   *  1. PostGIS lọc ứng viên: chuyến SCHEDULED, đủ ghế, trong khung giờ, tuyến đường đi qua gần
   *     điểm đón VÀ điểm trả (trong bán kính MATCH_CORRIDOR_KM).
   *  2. Gửi ứng viên sang matching engine để kiểm tra chiều đi, độ lệch đường, thời gian và chấm điểm.
   *  3. Trả về theo thứ tự engine đề xuất, dữ liệu (giá, tồn ghế) lấy từ DB.
   */
  async search(q: SearchTripsQueryDto): Promise<SearchTripsResponseDto> {
    const now = new Date();
    let from: Date;
    let to: Date;
    let desired: Date | null = null;
    try {
      if (q.time) {
        desired = vnDateTime(q.date, q.time);
        from = addMinutes(desired, -SEARCH_WINDOW_MINUTES);
        to = addMinutes(desired, SEARCH_WINDOW_MINUTES);
      } else {
        from = vnDateTime(q.date);
        to = addMinutes(from, 24 * 60);
      }
    } catch {
      throw new BadRequestException('Ngày giờ không hợp lệ');
    }
    if (from < now) from = now;

    const corridorM = this.env.matchCorridorKm * 1000;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT t.id
      FROM trips t
      WHERE t.status = 'SCHEDULED'
        AND t.available_seats >= ${q.seats}
        AND t.departure_time BETWEEN ${from} AND ${to}
        AND ST_DWithin(t.route_geog, ST_SetSRID(ST_MakePoint(${q.pickupLng}, ${q.pickupLat}), 4326)::geography, ${corridorM})
        AND ST_DWithin(t.route_geog, ST_SetSRID(ST_MakePoint(${q.dropoffLng}, ${q.dropoffLat}), 4326)::geography, ${corridorM})
      ORDER BY t.departure_time
      LIMIT ${MAX_CANDIDATES}
    `);

    const trips = rows.length
      ? await this.prisma.trip.findMany({
          where: { id: { in: rows.map((r) => r.id) } },
          include: TRIP_INCLUDE,
        })
      : [];
    const byId = new Map(trips.map((t) => [t.id, t]));

    const { suggestions, source } = await this.engine.match({
      request: {
        pickup: { lat: q.pickupLat, lng: q.pickupLng },
        dropoff: { lat: q.dropoffLat, lng: q.dropoffLng },
        seats: q.seats,
        desired_departure: desired?.toISOString() ?? null,
        time_window_minutes: SEARCH_WINDOW_MINUTES,
        max_pickup_distance_km: this.env.matchCorridorKm,
        max_dropoff_distance_km: this.env.matchCorridorKm,
      },
      candidates: trips.map((t) => ({
        trip_id: t.id,
        origin: { lat: t.originLat, lng: t.originLng },
        destination: { lat: t.destLat, lng: t.destLng },
        departure_time: t.departureTime.toISOString(),
        available_seats: t.availableSeats,
        price_per_seat: t.pricePerSeat,
      })),
      limit: 50,
    });

    const items = suggestions.flatMap((s) => {
      const trip = byId.get(s.trip_id);
      if (!trip) return []; // engine chỉ được đề xuất trong tập ứng viên backend gửi
      return [
        {
          ...toTripDto(trip),
          match: {
            score: s.score,
            pickupDistanceKm: s.pickup_distance_km,
            dropoffDistanceKm: s.dropoff_distance_km,
            detourKm: s.detour_km,
            timeDiffMinutes: s.time_diff_minutes,
            reasons: s.reasons,
          },
        },
      ];
    });

    return { items, matchSource: source, mapsProvider: this.maps.name };
  }

  // ---------------------------------------------------------------- Helpers

  private async getOwnedTrip(driverId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.driverId !== driverId) throw new NotFoundException('Không tìm thấy chuyến');
    return trip;
  }
}
