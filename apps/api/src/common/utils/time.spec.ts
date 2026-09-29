import { passengerCapacity } from './seats';
import { addMinutes, vnDateTime } from './time';

describe('vnDateTime', () => {
  it('hiểu ngày giờ theo múi giờ Việt Nam (UTC+7)', () => {
    expect(vnDateTime('2026-10-01', '07:30').toISOString()).toBe('2026-10-01T00:30:00.000Z');
  });

  it('mặc định 00:00 giờ VN = 17:00 UTC ngày hôm trước', () => {
    expect(vnDateTime('2026-10-01').toISOString()).toBe('2026-09-30T17:00:00.000Z');
  });

  it('báo lỗi với ngày không hợp lệ', () => {
    expect(() => vnDateTime('2026-13-45')).toThrow();
  });

  it('addMinutes', () => {
    expect(addMinutes(new Date('2026-01-01T00:00:00Z'), 90).toISOString()).toBe('2026-01-01T01:30:00.000Z');
  });
});

describe('passengerCapacity', () => {
  it('xe 5 chỗ tối đa 4 khách, xe 7 chỗ tối đa 6 khách', () => {
    expect(passengerCapacity('SEATS_5')).toBe(4);
    expect(passengerCapacity('SEATS_7')).toBe(6);
  });
});
