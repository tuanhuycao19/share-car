import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MAPS_PROVIDER, MapsProvider } from './maps.provider';
import { PlaceDto, PlaceQueryDto } from './place.dto';

@ApiTags('places')
@Controller('places')
export class MapsController {
  constructor(@Inject(MAPS_PROVIDER) private readonly maps: MapsProvider) {}

  /** Tìm địa điểm (MOCK — danh sách cố định, xem README) */
  @Public()
  @Get()
  search(@Query() query: PlaceQueryDto): Promise<PlaceDto[]> {
    return this.maps.searchPlaces(query.q, 10);
  }
}
