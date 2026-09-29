import { ApiProperty } from '@nestjs/swagger';

export class HealthDto {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status: 'ok' | 'degraded';
  database: boolean;
  redis: boolean;
  engine: boolean;
}
