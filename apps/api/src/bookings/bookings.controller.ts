import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BookingsService } from './bookings.service';
import { BookingDto, CancelBookingDto, CreateBookingDto } from './dto/booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Hành khách đặt ghế */
  @Roles('PASSENGER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto): Promise<BookingDto> {
    return this.bookings.create(user, dto);
  }

  /** Lịch sử đặt chỗ của hành khách */
  @Roles('PASSENGER')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser): Promise<BookingDto[]> {
    return this.bookings.listMine(user.id);
  }

  /** Hành khách hủy vé */
  @Roles('PASSENGER')
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ): Promise<BookingDto> {
    return this.bookings.cancelByPassenger(user, id, dto);
  }

  /** Tài xế từ chối khách */
  @Roles('DRIVER')
  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ): Promise<BookingDto> {
    return this.bookings.rejectByDriver(user, id, dto);
  }
}
