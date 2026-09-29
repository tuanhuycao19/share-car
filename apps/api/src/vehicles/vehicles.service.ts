import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleDto } from './dto/vehicle.dto';
import { toVehicleDto } from './vehicle.mapper';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(driverId: string): Promise<VehicleDto[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });
    return vehicles.map(toVehicleDto);
  }

  async create(driverId: string, dto: CreateVehicleDto): Promise<VehicleDto> {
    try {
      const v = await this.prisma.vehicle.create({ data: { ...dto, driverId } });
      return toVehicleDto(v);
    } catch (e) {
      throw this.mapError(e);
    }
  }

  async update(driverId: string, id: string, dto: UpdateVehicleDto): Promise<VehicleDto> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, driverId } });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');

    if (dto.type && dto.type !== vehicle.type) {
      const activeTrips = await this.prisma.trip.count({
        where: { vehicleId: id, status: { in: ['SCHEDULED', 'ONGOING'] } },
      });
      if (activeTrips > 0) {
        throw new BadRequestException('Không thể đổi loại xe khi xe đang có chuyến chưa hoàn thành');
      }
    }
    try {
      return toVehicleDto(await this.prisma.vehicle.update({ where: { id }, data: dto }));
    } catch (e) {
      throw this.mapError(e);
    }
  }

  private mapError(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('Biển số xe đã được đăng ký');
    }
    return e;
  }
}
