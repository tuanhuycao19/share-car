import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { TRIP_INCLUDE } from '../trips/trip.mapper';
import { toBookingDto } from './booking.mapper';
import { BookingDto, CancelBookingDto, CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Đặt ghế — toàn bộ trong 1 transaction:
   *  - Trừ tồn ghế bằng UPDATE có điều kiện `available_seats >= seats AND status = SCHEDULED`.
   *    Postgres khóa dòng & đánh giá lại điều kiện, nên các request đồng thời không thể đặt vượt.
   *  - Giá lấy từ Trip trong DB (không nhận giá từ client).
   *  - CHECK constraint `available_seats >= 0` ở DB là chốt chặn cuối.
   */
  async create(passenger: AuthUser, dto: CreateBookingDto): Promise<BookingDto> {
    const booking = await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: dto.tripId } });
      if (!trip) throw new NotFoundException('Không tìm thấy chuyến');
      if (trip.driverId === passenger.id) throw new ForbiddenException('Không thể đặt chuyến của chính bạn');
      if (trip.status !== 'SCHEDULED') throw new BadRequestException('Chuyến không còn nhận khách');
      if (trip.departureTime <= new Date()) throw new BadRequestException('Chuyến đã khởi hành');

      const existing = await tx.booking.count({
        where: { tripId: trip.id, passengerId: passenger.id, status: 'CONFIRMED' },
      });
      if (existing > 0) {
        throw new ConflictException('Bạn đã đặt chuyến này. Hãy hủy vé cũ nếu muốn đổi số ghế');
      }

      const reserved = await tx.trip.updateMany({
        where: { id: trip.id, status: 'SCHEDULED', availableSeats: { gte: dto.seats } },
        data: { availableSeats: { decrement: dto.seats } },
      });
      if (reserved.count === 0) {
        throw new ConflictException('Chuyến không còn đủ ghế trống');
      }

      return tx.booking.create({
        data: {
          tripId: trip.id,
          passengerId: passenger.id,
          seats: dto.seats,
          pricePerSeat: trip.pricePerSeat,
          totalPrice: trip.pricePerSeat * dto.seats,
          pickupAddress: dto.pickup.address,
          pickupLat: dto.pickup.lat,
          pickupLng: dto.pickup.lng,
          dropoffAddress: dto.dropoff.address,
          dropoffLat: dto.dropoff.lat,
          dropoffLng: dto.dropoff.lng,
          note: dto.note,
        },
        include: { trip: { include: TRIP_INCLUDE } },
      });
    });
    return toBookingDto(booking, { showDriverPhone: true });
  }

  async listMine(passengerId: string): Promise<BookingDto[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { passengerId },
      include: { trip: { include: TRIP_INCLUDE } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return bookings.map((b) =>
      toBookingDto(b, { showDriverPhone: b.status === 'CONFIRMED' || b.status === 'COMPLETED' }),
    );
  }

  /** Hành khách hủy vé (trước giờ khởi hành) — hoàn ghế trong cùng transaction. */
  async cancelByPassenger(passenger: AuthUser, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking || booking.passengerId !== passenger.id) throw new NotFoundException('Không tìm thấy vé');
    if (booking.trip.status !== 'SCHEDULED' || booking.trip.departureTime <= new Date()) {
      throw new BadRequestException('Chỉ hủy được vé trước khi chuyến khởi hành');
    }
    await this.release(bookingId, 'CANCELLED', dto.reason ?? 'Hành khách hủy vé');
    return this.getForPassenger(bookingId);
  }

  /** Tài xế từ chối khách (trước khi chuyến kết thúc) — hoàn ghế. */
  async rejectByDriver(driver: AuthUser, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking || booking.trip.driverId !== driver.id) throw new NotFoundException('Không tìm thấy vé');
    if (booking.trip.status !== 'SCHEDULED') {
      throw new BadRequestException('Chỉ từ chối khách khi chuyến chưa khởi hành');
    }
    await this.release(bookingId, 'REJECTED', dto.reason ?? 'Tài xế từ chối');
    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { passenger: true },
    });
    return toBookingDto(updated, { showPassengerPhone: true });
  }

  /**
   * Chuyển booking CONFIRMED → CANCELLED/REJECTED và hoàn ghế.
   * UPDATE có điều kiện status = CONFIRMED đảm bảo không hoàn ghế 2 lần khi bấm hủy đồng thời.
   */
  private async release(bookingId: string, status: 'CANCELLED' | 'REJECTED', reason: string) {
    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.booking.updateMany({
        where: { id: bookingId, status: 'CONFIRMED' },
        data: { status, cancelReason: reason, cancelledAt: new Date() },
      });
      if (changed.count === 0) throw new ConflictException('Vé không còn ở trạng thái đã xác nhận');
      const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
      await tx.trip.updateMany({
        where: { id: booking.tripId, status: 'SCHEDULED' },
        data: { availableSeats: { increment: booking.seats } },
      });
    });
  }

  private async getForPassenger(bookingId: string) {
    const b = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { trip: { include: TRIP_INCLUDE } },
    });
    return toBookingDto(b);
  }
}
