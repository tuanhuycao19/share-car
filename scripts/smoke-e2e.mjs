#!/usr/bin/env node
/**
 * Smoke test end-to-end: tài xế đăng chuyến → khách tìm chuyến → đặt ghế,
 * kèm kiểm tra phân quyền và chống đặt vượt ghế khi nhiều request đồng thời.
 *
 * Yêu cầu: API (và nên có engine) đang chạy, đã seed dữ liệu demo.
 * Chạy: pnpm smoke   (hoặc API_URL=http://localhost:4000 node scripts/smoke-e2e.mjs)
 */
const API = process.env.API_URL ?? 'http://localhost:4000';
const PASSWORD = 'Demo@123';

let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) failures++;
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const login = async (email) =>
  (await call('POST', '/auth/login', { body: { email, password: PASSWORD } })).data.accessToken;

async function registerPassenger(tag) {
  const rnd = `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  const res = await call('POST', '/auth/register', {
    body: {
      email: `smoke-${tag}-${rnd}@example.com`,
      phone: `09${rnd.slice(-8)}`,
      password: PASSWORD,
      fullName: `Khách smoke ${tag}`,
      role: 'PASSENGER',
    },
  });
  if (res.status !== 201) throw new Error(`Đăng ký thất bại: ${JSON.stringify(res.data)}`);
  return res.data.accessToken;
}

/** Ngày (YYYY-MM-DD) theo giờ VN, cách hôm nay `days` ngày */
function vnDate(days) {
  const d = new Date(Date.now() + 7 * 3600_000 + days * 86400_000);
  return d.toISOString().slice(0, 10);
}

const HANOI = { address: 'Hồ Hoàn Kiếm, Hà Nội', lat: 21.0285, lng: 105.8542 };
const HAI_DUONG = { address: 'TP Hải Dương', lat: 20.9373, lng: 106.3146 };
const HAI_PHONG = { address: 'Nhà hát lớn, Hải Phòng', lat: 20.8566, lng: 106.6829 };

async function main() {
  const health = await call('GET', '/health');
  check(health.status === 200 && health.data.database, `API healthy: ${JSON.stringify(health.data)}`);

  // ---- Tài xế đăng chuyến
  const driverToken = await login('taixe1@sharecar.vn');
  check(!!driverToken, 'Tài xế đăng nhập');
  const vehicles = (await call('GET', '/vehicles', { token: driverToken })).data;
  const car5 = vehicles.find((v) => v.type === 'SEATS_5' && v.isActive);
  check(car5?.passengerCapacity === 4, 'Xe 5 chỗ có tối đa 4 ghế khách');

  const date = vnDate(10 + Math.floor(Math.random() * 300));
  const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const departureTime = `${date}T09:${minute}:00+07:00`;

  const tooMany = await call('POST', '/trips', {
    token: driverToken,
    body: { vehicleId: car5.id, origin: HANOI, destination: HAI_PHONG, departureTime, pricePerSeat: 200000, totalSeats: 5 },
  });
  check(tooMany.status === 400, 'Không cho mở 5 ghế trên xe 5 chỗ');

  const created = await call('POST', '/trips', {
    token: driverToken,
    body: { vehicleId: car5.id, origin: HANOI, destination: HAI_PHONG, departureTime, pricePerSeat: 200000, totalSeats: 4 },
  });
  check(created.status === 201, `Tài xế đăng chuyến (${created.status})`);
  const trip = created.data;

  // ---- Phân quyền
  const passengerToken = await registerPassenger('main');
  check((await call('POST', '/trips', { token: passengerToken, body: {} })).status === 403, 'Khách không được đăng chuyến (403)');
  check((await call('GET', '/bookings/mine')).status === 401, 'Chưa đăng nhập không xem được vé (401)');
  check((await call('GET', '/admin/stats', { token: driverToken })).status === 403, 'Tài xế không vào được API admin (403)');

  // ---- Khách tìm chuyến: đón ở Hải Dương (giữa tuyến) → Hải Phòng
  const qs = new URLSearchParams({
    pickupLat: HAI_DUONG.lat, pickupLng: HAI_DUONG.lng,
    dropoffLat: HAI_PHONG.lat, dropoffLng: HAI_PHONG.lng,
    date, time: '09:00', seats: '2',
  });
  const search = await call('GET', `/trips/search?${qs}`);
  const found = search.data.items?.find((t) => t.id === trip.id);
  check(!!found, `Tìm thấy chuyến vừa đăng (matchSource=${search.data.matchSource}, score=${found?.match.score})`);

  const reverse = new URLSearchParams({
    pickupLat: HAI_PHONG.lat, pickupLng: HAI_PHONG.lng,
    dropoffLat: HAI_DUONG.lat, dropoffLng: HAI_DUONG.lng,
    date, seats: '1',
  });
  const rev = await call('GET', `/trips/search?${reverse}`);
  check(!rev.data.items.some((t) => t.id === trip.id), 'Chiều ngược lại không được đề xuất');

  // ---- Đặt ghế: giá do backend tính
  const booking = await call('POST', '/bookings', {
    token: passengerToken,
    body: { tripId: trip.id, seats: 2, pickup: HAI_DUONG, dropoff: HAI_PHONG, totalPrice: 1 },
  });
  check(booking.status === 400, 'Từ chối field lạ (totalPrice) từ client');
  const booked = await call('POST', '/bookings', {
    token: passengerToken,
    body: { tripId: trip.id, seats: 2, pickup: HAI_DUONG, dropoff: HAI_PHONG },
  });
  check(booked.status === 201 && booked.data.totalPrice === 400000, `Đặt 2 ghế, tổng ${booked.data.totalPrice}đ`);

  // ---- Đồng thời: 5 khách tranh 2 ghế còn lại
  const tokens = await Promise.all([1, 2, 3, 4, 5].map((i) => registerPassenger(`race${i}`)));
  const results = await Promise.all(
    tokens.map((t) =>
      call('POST', '/bookings', { token: t, body: { tripId: trip.id, seats: 1, pickup: HANOI, dropoff: HAI_PHONG } }),
    ),
  );
  const ok = results.filter((r) => r.status === 201).length;
  const conflict = results.filter((r) => r.status === 409).length;
  check(ok === 2 && conflict === 3, `Đặt đồng thời: ${ok} thành công, ${conflict} bị từ chối (409)`);
  const after = (await call('GET', `/trips/${trip.id}`)).data;
  check(after.availableSeats === 0, `Tồn ghế = ${after.availableSeats}`);

  // ---- Hủy vé hoàn ghế
  const cancel = await call('POST', `/bookings/${booked.data.id}/cancel`, { token: passengerToken, body: {} });
  check(cancel.status === 200 && cancel.data.status === 'CANCELLED', 'Khách hủy vé');
  const cancelAgain = await call('POST', `/bookings/${booked.data.id}/cancel`, { token: passengerToken, body: {} });
  check(cancelAgain.status === 409, 'Hủy lần 2 không hoàn ghế thêm (409)');
  check((await call('GET', `/trips/${trip.id}`)).data.availableSeats === 2, 'Tồn ghế được hoàn = 2');

  const history = (await call('GET', '/bookings/mine', { token: passengerToken })).data;
  check(history.length === 1 && history[0].trip.id === trip.id, 'Lịch sử đặt vé của khách');

  const paxList = (await call('GET', `/trips/${trip.id}/bookings`, { token: driverToken })).data;
  check(paxList.length === 3 && !!paxList[0].passenger.phone, 'Tài xế xem danh sách khách kèm SĐT');

  // ---- Dọn dẹp: tài xế hủy chuyến
  const cleanup = await call('PATCH', `/trips/${trip.id}/status`, {
    token: driverToken,
    body: { status: 'CANCELLED', reason: 'Smoke test' },
  });
  check(cleanup.status === 200 && cleanup.data.status === 'CANCELLED', 'Tài xế hủy chuyến (dọn dẹp)');

  console.log(failures ? `\n${failures} kiểm tra thất bại` : '\nTất cả kiểm tra đều đạt ✅');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
