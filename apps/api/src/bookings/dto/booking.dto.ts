import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { LocationDto } from '../../maps/place.dto';
import { TripDto } from '../../trips/dto/trip.dto';
import { UserSummaryDto } from '../../users/user.dto';

export class CreateBookingDto {
  @IsUUID()
  tripId: string;

  /** Số ghế muốn đặt */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  seats: number;

  /** Điểm đón của hành khách (nằm trên/gần tuyến) */
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  /** Điểm trả của hành khách */
  @ValidateNested()
  @Type(() => LocationDto)
  dropoff: LocationDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class BookingDto {
  id: string;
  tripId: string;
  seats: number;
  /** Đơn giá tại thời điểm đặt (VND) */
  pricePerSeat: number;
  /** Tổng tiền (VND) = seats × pricePerSeat, do backend tính */
  totalPrice: number;
  pickup: LocationDto;
  dropoff: LocationDto;
  note?: string | null;
  @ApiProperty({ enum: BookingStatus, enumName: 'BookingStatus' })
  status: BookingStatus;
  cancelReason?: string | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  /** Có khi tài xế/admin xem */
  passenger?: UserSummaryDto;
  /** Có khi hành khách xem lịch sử */
  trip?: TripDto;
}
