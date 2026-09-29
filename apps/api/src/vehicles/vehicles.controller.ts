import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateVehicleDto, UpdateVehicleDto, VehicleDto } from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@Roles('DRIVER')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  /** Danh sách xe của tài xế đang đăng nhập */
  @Get()
  list(@CurrentUser() user: AuthUser): Promise<VehicleDto[]> {
    return this.vehicles.list(user.id);
  }

  /** Thêm xe */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto): Promise<VehicleDto> {
    return this.vehicles.create(user.id, dto);
  }

  /** Cập nhật xe / ngừng sử dụng (isActive=false) */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleDto> {
    return this.vehicles.update(user.id, id, dto);
  }
}
