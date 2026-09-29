import { Transform, Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class PlaceDto {
  id: string;
  /** Tên ngắn, ví dụ "Bến xe Mỹ Đình" */
  name: string;
  /** Địa chỉ đầy đủ để hiển thị */
  address: string;
  /** Tỉnh / thành phố */
  province: string;
  lat: number;
  lng: number;
}

export class PlaceQueryDto {
  /** Từ khóa (không phân biệt dấu). Bỏ trống để lấy danh sách gợi ý. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

/** Một điểm địa lý có địa chỉ — dùng cho điểm đi/đến, điểm đón/trả */
export class LocationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;
}
