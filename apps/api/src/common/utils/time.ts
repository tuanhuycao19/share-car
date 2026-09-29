/** Việt Nam dùng UTC+7 cố định (không có giờ mùa hè). */
export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VN_OFFSET = '+07:00';

/** Chuyển ngày (YYYY-MM-DD) + giờ (HH:mm) theo giờ VN sang Date (UTC). */
export function vnDateTime(date: string, time = '00:00'): Date {
  const d = new Date(`${date}T${time}:00${VN_OFFSET}`);
  if (Number.isNaN(d.getTime())) throw new Error('Ngày giờ không hợp lệ');
  return d;
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}
