import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { EngineService } from '../engine/engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HealthDto } from './health.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly engine: EngineService,
  ) {}

  /** Kiểm tra kết nối DB, Redis, engine */
  @Public()
  @Get()
  async check(): Promise<HealthDto> {
    const [database, redis, engine] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(
        () => true,
        () => false,
      ),
      this.redis.ping(),
      this.engine.health(),
    ]);
    return { status: database && redis && engine ? 'ok' : 'degraded', database, redis, engine };
  }
}
