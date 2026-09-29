/**
 * Seed dữ liệu demo. Chạy: pnpm db:seed (idempotent — xóa & tạo lại dữ liệu demo).
 *
 * Tài khoản demo (mật khẩu chung: Demo@123):
 *   admin@sharecar.vn       — ADMIN
 *   taixe1@sharecar.vn      — DRIVER đã duyệt, có xe 5 & 7 chỗ, đã đăng chuyến
 *   taixe2@sharecar.vn      — DRIVER chờ duyệt
 *   khach1@sharecar.vn      — PASSENGER, đã có 1 vé
 *   khach2@sharecar.vn      — PASSENGER
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PASSWORD = 'Demo@123';

const PLACES = {
  hanoi: { address: 'Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội', lat: 21.0285, lng: 105.8542 },
  myDinh: { address: '20 Phạm Hùng, Nam Từ Liêm, Hà Nội', lat: 21.0287, lng: 105.7784 },
  haiDuong: { address: 'Trung tâm TP Hải Dương', lat: 20.9373, lng: 106.3146 },
  haiPhong: { address: 'Nhà hát lớn, Hồng Bàng, Hải Phòng', lat: 20.8566, lng: 106.6829 },
  haLong: { address: 'Bãi Cháy, Hạ Long, Quảng Ninh', lat: 20.9517, lng: 107.08 },
  namDinh: { address: 'Trung tâm TP Nam Định', lat: 20.42, lng: 106.1683 },
  benThanh: { address: 'Lê Lợi, Quận 1, TP.HCM', lat: 10.7725, lng: 106.698 },
  vungTau: { address: 'Bãi Trước, Vũng Tàu', lat: 10.346, lng: 107.0843 },
};

/** Ngày mai theo giờ VN, lúc hh:mm (UTC+7) */
function tomorrowAt(hh: number, mm = 0, dayOffset = 1): Date {
  const nowVn = new Date(Date.now() + 7 * 3600_000);
  const d = new Date(
    Date.UTC(nowVn.getUTCFullYear(), nowVn.getUTCMonth(), nowVn.getUTCDate() + dayOffset, hh, mm),
  );
  return new Date(d.getTime() - 7 * 3600_000);
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const emails = [
    'admin@sharecar.vn',
    'taixe1@sharecar.vn',
    'taixe2@sharecar.vn',
    'khach1@sharecar.vn',
    'khach2@sharecar.vn',
  ];

  // Xóa dữ liệu demo cũ (theo thứ tự khóa ngoại)
  const oldUsers = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = oldUsers.map((u) => u.id);
  await prisma.booking.deleteMany({
    where: { OR: [{ passengerId: { in: ids } }, { trip: { driverId: { in: ids } } }] },
  });
  await prisma.trip.deleteMany({ where: { driverId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  const admin = await prisma.user.create({
    data: { email: 'admin@sharecar.vn', phone: '0900000001', fullName: 'Quản trị viên', role: 'ADMIN', passwordHash },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: 'taixe1@sharecar.vn',
      phone: '0900000002',
      fullName: 'Nguyễn Văn Tài',
      role: 'DRIVER',
      passwordHash,
      driverProfile: {
        create: { licenseNumber: '010203040506', status: 'APPROVED', reviewedAt: new Date(), reviewedById: admin.id },
      },
      vehicles: {
        create: [
          { plateNumber: '30A-123.45', brand: 'Toyota', model: 'Vios', color: 'Trắng', type: 'SEATS_5' },
          { plateNumber: '30G-678.90', brand: 'Mitsubishi', model: 'Xpander', color: 'Bạc', type: 'SEATS_7' },
        ],
      },
    },
    include: { vehicles: true },
  });
  const car5 = driver1.vehicles.find((v) => v.type === 'SEATS_5')!;
  const car7 = driver1.vehicles.find((v) => v.type === 'SEATS_7')!;

  await prisma.user.create({
    data: {
      email: 'taixe2@sharecar.vn',
      phone: '0900000003',
      fullName: 'Trần Thị Lái',
      role: 'DRIVER',
      passwordHash,
      driverProfile: { create: { licenseNumber: '090807060504' } },
      vehicles: { create: [{ plateNumber: '51K-111.22', brand: 'Kia', model: 'Carnival', type: 'SEATS_7' }] },
    },
  });

  const passenger1 = await prisma.user.create({
    data: { email: 'khach1@sharecar.vn', phone: '0900000004', fullName: 'Lê Văn Khách', role: 'PASSENGER', passwordHash },
  });
  await prisma.user.create({
    data: { email: 'khach2@sharecar.vn', phone: '0900000005', fullName: 'Phạm Thị Hành', role: 'PASSENGER', passwordHash },
  });

  const trip = (
    vehicle: typeof car5,
    from: (typeof PLACES)[keyof typeof PLACES],
    to: (typeof PLACES)[keyof typeof PLACES],
    departureTime: Date,
    pricePerSeat: number,
    totalSeats: number,
    note?: string,
  ) => ({
    driverId: driver1.id,
    vehicleId: vehicle.id,
    originAddress: from.address,
    originLat: from.lat,
    originLng: from.lng,
    destAddress: to.address,
    destLat: to.lat,
    destLng: to.lng,
    departureTime,
    pricePerSeat,
    totalSeats,
    availableSeats: totalSeats,
    note,
  });

  const hnHp = await prisma.trip.create({
    data: trip(car7, PLACES.hanoi, PLACES.haiPhong, tomorrowAt(7, 0), 180_000, 6, 'Đón dọc đường cao tốc 5B'),
  });
  await prisma.trip.createMany({
    data: [
      trip(car5, PLACES.myDinh, PLACES.haiPhong, tomorrowAt(13, 30), 200_000, 4),
      trip(car5, PLACES.hanoi, PLACES.haLong, tomorrowAt(17, 0), 250_000, 4),
      trip(car7, PLACES.haiPhong, PLACES.hanoi, tomorrowAt(19, 0), 180_000, 6, 'Chiều về Hà Nội'),
      trip(car5, PLACES.hanoi, PLACES.namDinh, tomorrowAt(8, 0, 2), 150_000, 4),
      trip(car7, PLACES.benThanh, PLACES.vungTau, tomorrowAt(6, 30), 160_000, 6),
    ],
  });

  // Một vé mẫu: khách1 đi Hà Nội → Hải Dương trên chuyến HN–HP, 2 ghế
  await prisma.$transaction([
    prisma.trip.update({ where: { id: hnHp.id }, data: { availableSeats: { decrement: 2 } } }),
    prisma.booking.create({
      data: {
        tripId: hnHp.id,
        passengerId: passenger1.id,
        seats: 2,
        pricePerSeat: hnHp.pricePerSeat,
        totalPrice: hnHp.pricePerSeat * 2,
        pickupAddress: PLACES.hanoi.address,
        pickupLat: PLACES.hanoi.lat,
        pickupLng: PLACES.hanoi.lng,
        dropoffAddress: PLACES.haiDuong.address,
        dropoffLat: PLACES.haiDuong.lat,
        dropoffLng: PLACES.haiDuong.lng,
      },
    }),
  ]);

  console.log('✔ Seed xong. Mật khẩu chung cho tài khoản demo:', PASSWORD);
  console.table(emails.map((email) => ({ email })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
