import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Dùng chung file .env ở thư mục gốc monorepo (không ghi đè biến đã có, ví dụ trong Docker).
config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
