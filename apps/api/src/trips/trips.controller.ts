import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingDto } from '../bookings/dto/booking.dto';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateTripDto,
  SearchTripsQueryDto,
  SearchTripsResponseDto,
  TripDto,
  TripQueryDto,
  UpdateTripDto,
  UpdateTripStatusDto,
} from './dto/trip.dto';
import { TripsService } from './trips.service';

@ApiTags('trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  /** Tìm chuyến phù hợp theo điểm đón/trả, ngày giờ, số ghế (công khai) */
  @Public()
  @Get('search')
  search(@Query() query: SearchTripsQueryDto): Promise<SearchTripsResponseDto> {
    return this.trips.search(query);
  }

  /** Các chuyến của tài xế đang đăng nhập */
  @ApiBearerAuth()
  @Roles('DRIVER')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser, @Query() query: TripQueryDto): Promise<TripDto[]> {
    return this.trips.listForDriver(user.id, query);
  }

  /** Chi tiết chuyến (công khai, ẩn SĐT tài xế) */
  @Public()
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<TripDto> {
    return this.trips.getById(id);
  }

  /** Tài xế đăng chuyến mới */
  @ApiBearerAuth()
  @Roles('DRIVER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTripDto): Promise<TripDto> {
    return this.trips.create(user, dto);
  }

  /** Tài xế sửa giá (khi chưa có khách) hoặc ghi chú */
  @ApiBearerAuth()
  @Roles('DRIVER')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
  ): Promise<TripDto> {
    return this.trips.update(user.id, id, dto);
  }

  /** Tài xế cập nhật trạng thái chuyến */
  @ApiBearerAuth()
  @Roles('DRIVER')
  @Patch(':id/status')
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripStatusDto,
  ): Promise<TripDto> {
    return this.trips.changeStatus(user.id, id, dto);
  }

  /** Danh sách khách của chuyến (kèm SĐT) — chỉ tài xế của chuyến */
  @ApiBearerAuth()
  @Roles('DRIVER')
  @Get(':id/bookings')
  bookings(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingDto[]> {
    return this.trips.listBookingsForDriver(user.id, id);
  }
}
