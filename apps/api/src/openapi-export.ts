/**
 * Xuất OpenAPI spec ra file mà không cần DB/Redis (Prisma & Redis kết nối lười).
 * Dùng: pnpm --filter @share-car/api openapi:export
 */
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApi } from './setup';

process.env.JWT_SECRET ??= 'openapi-export-dummy-secret-openapi-export';
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db';

async function main() {
  const out = path.resolve(process.argv[2] ?? 'openapi.json');
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  writeFileSync(out, JSON.stringify(buildOpenApi(app), null, 2) + '\n');
  await app.close();
  console.log(`Đã ghi OpenAPI spec: ${out}`);
}

void main();
