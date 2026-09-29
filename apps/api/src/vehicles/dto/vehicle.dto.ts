import { ApiProperty, PartialType } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateVehicleDto {
  /** Biển số, ví dụ 30A-123.45 */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[0-9]{2}[A-Z]{1,2}[0-9]?-?[0-9]{3}\.?[0-9]{2}$/, { message: 'Biển số không hợp lệ (vd: 30A-123.45)' })
  plateNumber: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  brand: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  model: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  /** SEATS_5 (tối đa 4 khách) hoặc SEATS_7 (tối đa 6 khách) */
  @ApiProperty({ enum: VehicleType, enumName: 'VehicleType' })
  @IsEnum(VehicleType)
  type: VehicleType;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VehicleDto {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  color?: string | null;
  @ApiProperty({ enum: VehicleType, enumName: 'VehicleType' })
  type: VehicleType;
  /** Số ghế hành khách tối đa (4 hoặc 6) */
  passengerCapacity: number;
  isActive: boolean;
  createdAt: Date;
}
