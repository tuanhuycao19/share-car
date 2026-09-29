import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocationDto } from '../../maps/place.dto';
import { UserSummaryDto } from '../../users/user.dto';
import { VehicleDto } from '../../vehicles/dto/vehicle.dto';

export const MIN_PRICE_PER_SEAT = 10_000;
export const MAX_PRICE_PER_SEAT = 5_000_000;

export class CreateTripDto {
  @IsUUID()
  vehicleId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  /** Giờ khởi hành (ISO 8601, có múi giờ, ví dụ 2026-10-01T07:30:00+07:00) */
  @IsDateString({ strict: true }, { message: 'Giờ khởi hành không hợp lệ' })
  departureTime: string;

  /** Giá mỗi ghế (VND), bội số của 1.000 */
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PRICE_PER_SEAT, { message: 'Giá mỗi ghế tối thiểu 10.000đ' })
  @Max(MAX_PRICE_PER_SEAT, { message: 'Giá mỗi ghế tối đa 5.000.000đ' })
  pricePerSeat: number;

  /** Số ghế mở bán (xe 5 chỗ ≤ 4, xe 7 chỗ ≤ 6) */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  totalSeats: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateTripDto {
  /** Chỉ đổi được khi chuyến chưa có khách đặt */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PRICE_PER_SEAT)
  @Max(MAX_PRICE_PER_SEAT)
  pricePerSeat?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateTripStatusDto {
  /** SCHEDULED → ONGOING → COMPLETED; hoặc hủy (CANCELLED) khi chưa hoàn thành */
  @ApiProperty({ enum: ['ONGOING', 'COMPLETED', 'CANCELLED'] })
  @IsIn(['ONGOING', 'COMPLETED', 'CANCELLED'])
  status: 'ONGOING' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class SearchTripsQueryDto {
  @Type(() => Number)
  @IsLatitude()
  pickupLat: number;

  @Type(() => Number)
  @IsLongitude()
  pickupLng: number;

  @Type(() => Number)
  @IsLatitude()
  dropoffLat: number;

  @Type(() => Number)
  @IsLongitude()
  dropoffLng: number;

  /** Ngày đi theo giờ Việt Nam (YYYY-MM-DD) */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày không hợp lệ (YYYY-MM-DD)' })
  date: string;

  /** Giờ mong muốn theo giờ Việt Nam (HH:mm). Bỏ trống = cả ngày */
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Giờ không hợp lệ (HH:mm)' })
  time?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  seats: number = 1;
}

export class TripQueryDto {
  @IsOptional()
  @ApiProperty({ enum: TripStatus, enumName: 'TripStatus', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsIn(Object.values(TripStatus))
  status?: TripStatus;
}

export class TripDto {
  id: string;
  origin: LocationDto;
  destination: LocationDto;
  departureTime: Date;
  /** VND */
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  @ApiProperty({ enum: TripStatus, enumName: 'TripStatus' })
  status: TripStatus;
  note?: string | null;
  driver: UserSummaryDto;
  vehicle: VehicleDto;
  /** Số ghế đã được đặt = totalSeats - availableSeats */
  bookedSeats: number;
  createdAt: Date;
}

export class MatchInfoDto {
  /** Điểm phù hợp 0–100 (cao hơn là tốt hơn) */
  score: number;
  /** Khoảng cách từ điểm đón tới tuyến đường của chuyến (km) */
  pickupDistanceKm: number;
  /** Khoảng cách từ điểm trả tới tuyến đường của chuyến (km) */
  dropoffDistanceKm: number;
  /** Quãng đường tài xế phải đi thêm để đón/trả (km, ước lượng) */
  detourKm: number;
  /** Lệch so với giờ mong muốn (phút, dương = chuyến đi muộn hơn) */
  timeDiffMinutes?: number | null;
  reasons: string[];
}

export class TripMatchDto extends TripDto {
  match: MatchInfoDto;
}

export class SearchTripsResponseDto {
  items: TripMatchDto[];
  /** engine = do matching engine xếp hạng; fallback = engine lỗi, dùng xếp hạng dự phòng */
  @ApiProperty({ enum: ['engine', 'fallback'] })
  matchSource: 'engine' | 'fallback';
  /** Tên maps provider đang dùng ("mock" ở giai đoạn đầu) */
  mapsProvider: string;
}
