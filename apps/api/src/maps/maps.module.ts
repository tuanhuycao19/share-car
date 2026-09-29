import { Global, Module } from '@nestjs/common';
import { MapsController } from './maps.controller';
import { MAPS_PROVIDER } from './maps.provider';
import { MockMapsProvider } from './mock-maps.provider';

@Global()
@Module({
  controllers: [MapsController],
  // Đổi useClass sang provider thật khi tích hợp dịch vụ bản đồ
  providers: [{ provide: MAPS_PROVIDER, useClass: MockMapsProvider }],
  exports: [MAPS_PROVIDER],
})
export class MapsModule {}
