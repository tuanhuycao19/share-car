import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppConfigModule } from './config/config.module';
import { EngineModule } from './engine/engine.module';
import { HealthController } from './health/health.controller';
import { MapsModule } from './maps/maps.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TripsModule } from './trips/trips.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    MapsModule,
    EngineModule,
    AuthModule,
    VehiclesModule,
    TripsModule,
    BookingsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Thứ tự quan trọng: xác thực JWT trước, rồi kiểm tra role
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
