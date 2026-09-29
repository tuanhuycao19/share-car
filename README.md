# ShareCar — Đặt xe ghép 5 chỗ / 7 chỗ

Ứng dụng web responsive để **tài xế đăng chuyến**, **hành khách tìm & đặt ghế**, **admin duyệt tài xế và quản lý hệ thống**.
UI tiếng Việt, tiền tệ VND, thời gian hiển thị theo `Asia/Ho_Chi_Minh`.

## Kiến trúc

```
share-car/
├── apps/
│   ├── web/              Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query
│   └── api/              NestJS 11 + Prisma 6 + PostgreSQL/PostGIS — auth, phân quyền, nghiệp vụ
├── services/
│   └── engine/           Python + FastAPI — matching engine (đề xuất & xếp hạng chuyến)
├── packages/
│   └── api-client/       Client TypeScript sinh từ OpenAPI (openapi-typescript + openapi-fetch)
├── infra/                Docker Compose + Dockerfile
└── scripts/smoke-e2e.mjs Smoke test end-to-end qua HTTP
```

```
Trình duyệt ──► web (Next.js) ──► api (NestJS) ──► PostgreSQL + PostGIS
                                     │   ├──► Redis (giới hạn đăng nhập sai)
                                     │   └──► engine (FastAPI) — chỉ ĐỀ XUẤT
                                     └── quyết định & lưu booking trong transaction
```

**Phân chia trách nhiệm**

| Thành phần | Làm gì | Không làm gì |
|---|---|---|
| `api` | Xác thực JWT, phân quyền theo role, kiểm tra giá & sức chứa, trừ/hoàn ghế trong transaction, lưu booking | — |
| `engine` | Nhận yêu cầu + danh sách ứng viên, kiểm tra chiều đi, độ lệch tuyến, detour, thời gian; chấm điểm 0–100 | Không truy cập DB, không tạo booking |
| `web` | Giao diện theo role; ẩn/hiện trang theo role (chỉ là UX) | Không tính giá, không quyết định quyền |

### Luồng tìm chuyến

1. `GET /trips/search` — backend lọc thô bằng **PostGIS**: chuyến `SCHEDULED`, đủ ghế, trong khung giờ, và tuyến đường (`route_geog`) đi qua trong bán kính `MATCH_CORRIDOR_KM` của **cả** điểm đón lẫn điểm trả (`ST_DWithin`, có GiST index).
2. Backend gửi ứng viên sang `engine` `POST /v1/match`. Engine loại chuyến ngược chiều (điểm đón nằm sau điểm trả trên tuyến), quá xa tuyến, lệch giờ; rồi chấm điểm.
3. Backend trả kết quả theo thứ tự engine, nhưng giá/tồn ghế luôn lấy từ DB. Nếu engine lỗi/timeout → xếp hạng dự phòng (`matchSource: "fallback"`).

### Chống đặt vượt số ghế

Trong `BookingsService.create` (một `prisma.$transaction`):

```sql
UPDATE trips SET available_seats = available_seats - :seats
WHERE id = :id AND status = 'SCHEDULED' AND available_seats >= :seats
```

Postgres khóa dòng và đánh giá lại điều kiện, nên các request đồng thời không thể đặt quá số ghế; nếu 0 dòng bị ảnh hưởng → `409 Conflict`.
Thêm các chốt chặn ở DB: `CHECK (available_seats BETWEEN 0 AND total_seats)`, `CHECK (total_seats BETWEEN 1 AND 6)`, `CHECK (total_price = seats * price_per_seat)`.
Hủy/từ chối vé dùng `UPDATE ... WHERE status = 'CONFIRMED'` nên không thể hoàn ghế hai lần.

Giá: client **không** gửi giá. Backend lấy `price_per_seat` từ chuyến và tính `total_price`. Field lạ trong body bị từ chối (`forbidNonWhitelisted`).

## Nghiệp vụ & phân quyền

| Role | Chức năng |
|---|---|
| Hành khách (`PASSENGER`) | Tìm chuyến theo điểm đón/trả, ngày giờ, số ghế; đặt ghế; hủy vé trước giờ đi; xem lịch sử & SĐT tài xế sau khi đặt |
| Tài xế (`DRIVER`) | Quản lý xe; đăng chuyến (chỉ khi đã được duyệt), đặt giá mỗi ghế; xem danh sách khách kèm SĐT; từ chối khách; chuyển trạng thái chuyến `SCHEDULED → ONGOING → COMPLETED` hoặc hủy |
| Admin (`ADMIN`) | Duyệt/từ chối tài xế; khóa/mở khóa người dùng; xem & hủy chuyến; số liệu tổng quan |

- Xe `SEATS_5` tối đa **4** ghế khách, `SEATS_7` tối đa **6** ghế khách (kiểm tra ở backend + CHECK ở DB).
- Mọi route mặc định yêu cầu JWT (`JwtAuthGuard` toàn cục), route công khai đánh dấu `@Public()`, giới hạn role bằng `@Roles(...)` (`RolesGuard`). User được nạp lại mỗi request nên khóa tài khoản có hiệu lực ngay.
- Chỉ đăng ký được `PASSENGER` / `DRIVER`; admin tạo qua seed.

## Schema cơ bản

`User` · `DriverProfile` (1–1 với User, trạng thái duyệt) · `Vehicle` (loại 5/7 chỗ) · `Trip` (điểm đi/đến, giờ đi, giá/ghế, tổng ghế, tồn ghế, trạng thái, cột PostGIS sinh tự động) · `Booking` (số ghế, đơn giá chốt tại thời điểm đặt, tổng tiền, điểm đón/trả riêng của khách).
Xem [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) và migration [`apps/api/prisma/migrations`](apps/api/prisma/migrations).

## ⚠️ Các phần đang MOCK

| Phần | Mock hiện tại | Chỗ thay thế |
|---|---|---|
| Tìm địa điểm (geocoding) | Danh sách ~30 địa điểm cố định (Hà Nội, miền Bắc, TP.HCM & lân cận) với tọa độ gần đúng | `apps/api/src/maps/mock-places.ts`, `MockMapsProvider` → cài `MapsProvider` mới và đổi `useClass` trong `maps.module.ts` |
| Tuyến đường của chuyến | Đoạn thẳng điểm đi → điểm đến (cột `route_geog` sinh từ lat/lng) | Migration thay cột generated bằng polyline ghi từ routing provider |
| Khoảng cách/routing trong engine | Haversine × 1.25 | `services/engine/app/geo.py` → cài `RoutingProvider` thật (OSRM, GraphHopper, Goong, Vietmap...) |

UI hiển thị nhãn “Bản đồ mô phỏng” trong kết quả tìm kiếm. Chưa có thanh toán online và GPS realtime (thanh toán trực tiếp cho tài xế).

## Chạy local

### Yêu cầu

- Node.js ≥ 22, pnpm 10 (`corepack enable`)
- Python ≥ 3.11 và [uv](https://docs.astral.sh/uv/)
- Docker + Docker Compose ≥ 2.24 (cho Postgres/PostGIS và Redis)

### Các bước

```bash
cp .env.example .env            # một file .env dùng chung cho api, web, engine, docker compose
pnpm install                    # cài dependency TS (tự chạy prisma generate)
pnpm infra:up                   # Postgres 16 + PostGIS 3.4, Redis 7

pnpm db:deploy                  # áp migration (hoặc pnpm db:migrate khi đang phát triển schema)
pnpm db:seed                    # dữ liệu demo

(cd services/engine && uv sync) # cài dependency engine
pnpm dev:engine                 # engine: http://localhost:8000  (docs: /docs)
pnpm dev                        # api: http://localhost:4000 (Swagger: /docs) + web: http://localhost:3000
```

Kiểm tra: `curl localhost:4000/health` → `{"status":"ok","database":true,"redis":true,"engine":true}`

### Tài khoản demo (mật khẩu `Demo@123`)

| Email | Vai trò |
|---|---|
| `admin@sharecar.vn` | Admin |
| `taixe1@sharecar.vn` | Tài xế đã duyệt — có xe 5 & 7 chỗ, đã đăng chuyến ngày mai |
| `taixe2@sharecar.vn` | Tài xế chờ duyệt |
| `khach1@sharecar.vn` | Hành khách — đã có 1 vé Hà Nội → Hải Dương |
| `khach2@sharecar.vn` | Hành khách |

Trang đăng nhập (môi trường dev) có nút điền nhanh các tài khoản này.

### Thử luồng chính trên giao diện

1. Đăng nhập `taixe1@sharecar.vn` → **Đăng chuyến**: chọn xe, điểm đi “Mỹ Đình”, điểm đến “Hải Phòng”, giờ đi, giá mỗi ghế.
2. Đăng nhập `khach2@sharecar.vn` (có thể trên điện thoại) → tìm **Hải Dương → Hải Phòng** đúng ngày → chuyến Hà Nội–Hải Phòng được đề xuất vì đi qua Hải Dương → **Xác nhận đặt ghế**.
3. Quay lại tài xế → mở chuyến để xem khách, SĐT, doanh thu dự kiến; bấm “Bắt đầu chạy” / “Hoàn thành”.
4. Đăng nhập admin → **Duyệt tài xế** `taixe2`.

### Chạy toàn bộ bằng Docker

```bash
cp .env.example .env
pnpm stack:up        # build & chạy postgres, redis, engine, api (tự migrate), web
pnpm stack:seed      # seed dữ liệu demo
```

Web: http://localhost:3000 · API: http://localhost:4000/docs · Engine: http://localhost:8000/docs.
`NEXT_PUBLIC_API_URL` được nhúng lúc build web — là địa chỉ API mà trình duyệt gọi tới.

## Kiểm thử

```bash
pnpm typecheck                          # TypeScript cho api, web, api-client
pnpm --filter @share-car/api test       # unit test API (Jest)
cd services/engine && uv run pytest     # test thuật toán matching
cd services/engine && uv run ruff check .
pnpm smoke                              # E2E qua HTTP (cần api + engine đang chạy và đã seed)
```

`pnpm smoke` kiểm tra: tài xế đăng chuyến → khách tìm chuyến (đón giữa tuyến) → đặt ghế với giá do backend tính; chặn đặt vượt khi 5 khách tranh 2 ghế đồng thời; hủy vé hoàn ghế đúng 1 lần; phân quyền 401/403.

## Client sinh từ OpenAPI

Sau khi đổi controller/DTO trong `apps/api`:

```bash
pnpm api-client:generate
```

Lệnh này build API, xuất `packages/api-client/openapi.json` (không cần DB) rồi sinh `src/schema.d.ts`. Web dùng:

```ts
const { data } = await api.GET('/trips/{id}', { params: { path: { id } } }); // typed hoàn toàn
```

DTO response được mô tả bằng class `*.dto.ts`; plugin `@nestjs/swagger` tự đọc kiểu & JSDoc nên không cần viết `@ApiProperty` cho từng field.

## Biến môi trường

Xem [`.env.example`](.env.example). Quan trọng nhất:

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Kết nối Postgres (cần extension PostGIS — user phải có quyền `CREATE EXTENSION`, hoặc tạo sẵn extension) |
| `JWT_SECRET` | ≥ 32 ký tự, **bắt buộc đổi** ở môi trường thật |
| `ENGINE_URL`, `ENGINE_TIMEOUT_MS` | Địa chỉ engine; quá thời gian sẽ dùng xếp hạng dự phòng |
| `MATCH_CORRIDOR_KM` | Bán kính quanh tuyến để PostGIS lọc ứng viên |
| `NEXT_PUBLIC_API_URL` | URL API cho trình duyệt |

## Ghi chú mở rộng

- **Auth**: JWT lưu ở `localStorage` cho đơn giản. Khi lên production nên chuyển sang httpOnly cookie + refresh token.
- **Prisma 6** được chọn (thay vì 7/8) để giữ CommonJS + `prisma-client-js` ổn định với NestJS.
- **shadcn/ui**: component nằm trong `apps/web/src/components/ui` (style new-york, Tailwind v4). Có `components.json` để thêm component bằng `pnpm dlx shadcn@latest add <name>`.
- Múi giờ: DB lưu `timestamptz` (UTC). Web nhập/hiển thị theo giờ VN (UTC+7 cố định), API tìm kiếm nhận `date`/`time` theo giờ VN.
- Hướng tiếp theo: thông báo (email/SMS/push), đánh giá tài xế, thanh toán online, bản đồ & tuyến đường thật, ghép nhiều khách tối ưu trên một chuyến (engine đã tách riêng để phát triển thuật toán).
