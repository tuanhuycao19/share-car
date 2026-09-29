import 'reflect-metadata';
import path from 'node:path';
import { config } from 'dotenv';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';
import { buildOpenApi, configureApp } from './setup';

// Dùng chung .env ở gốc monorepo khi chạy local (trong Docker biến đã được truyền sẵn).
config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  configureApp(app, env.corsOrigins);
  SwaggerModule.setup('docs', app, buildOpenApi(app), { jsonDocumentUrl: 'docs/openapi.json' });

  await app.listen(env.port);
  Logger.log(`API chạy tại http://localhost:${env.port} — Swagger: /docs`, 'Bootstrap');
}

void bootstrap();
