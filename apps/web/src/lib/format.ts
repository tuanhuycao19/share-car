/** Mọi thời gian hiển thị theo múi giờ Việt Nam, bất kể máy người dùng ở đâu. */
export const VN_TZ = 'Asia/Ho_Chi_Minh';
/** Việt Nam dùng UTC+7 cố định (không có giờ mùa hè) */
const VN_OFFSET = '+07:00';

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount);
}

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDateTime(iso: string | Date): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTime(iso: string | Date): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDate(iso: string | Date): string {
  return dateFormatter.format(new Date(iso));
}

/** Ngày hôm nay theo giờ VN, dạng YYYY-MM-DD (dùng cho <input type="date">) */
export function vnToday(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  // en-CA cho định dạng YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: VN_TZ }).format(d);
}

/** Giá trị <input type="datetime-local"> (hiểu là giờ VN) → ISO có offset +07:00 */
export function vnLocalInputToIso(value: string): string {
  return `${value}:00${VN_OFFSET}`;
}

/** ISO → giá trị cho <input type="datetime-local"> theo giờ VN */
export function isoToVnLocalInput(iso: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}`;
}
