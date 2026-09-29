'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Location } from '@share-car/api-client';
import { ArrowUpDownIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PlacePicker } from '@/components/place-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { vnToday } from '@/lib/format';
import { searchToParams, type TripSearch } from '@/lib/search-params';

export function SearchForm({ initial }: { initial?: Partial<TripSearch> }) {
  const router = useRouter();
  const [pickup, setPickup] = useState<Location | null>(initial?.pickup ?? null);
  const [dropoff, setDropoff] = useState<Location | null>(initial?.dropoff ?? null);
  const [date, setDate] = useState(initial?.date ?? vnToday());
  const [time, setTime] = useState(initial?.time ?? '');
  const [seats, setSeats] = useState(initial?.seats ?? 1);
  // Đổi key để PlacePicker cập nhật text khi hoán đổi điểm đón/trả
  const [swapKey, setSwapKey] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) {
      toast.error('Vui lòng chọn điểm đón và điểm trả từ danh sách gợi ý');
      return;
    }
    const params = searchToParams({ pickup, dropoff, date, time: time || undefined, seats });
    router.push(`/trips/search?${params}`);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-12 md:items-end">
      <div className="md:col-span-4">
        <PlacePicker key={`p${swapKey}`} label="Điểm đón" value={pickup} onChange={setPickup} required />
      </div>
      <div className="-my-2 flex justify-center md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Đổi chiều"
          onClick={() => {
            setPickup(dropoff);
            setDropoff(pickup);
            setSwapKey((k) => k + 1);
          }}
        >
          <ArrowUpDownIcon />
        </Button>
      </div>
      <div className="md:col-span-4">
        <PlacePicker key={`d${swapKey}`} label="Điểm trả" value={dropoff} onChange={setDropoff} required />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:col-span-4">
        <div className="col-span-2 space-y-2 sm:col-span-1">
          <Label htmlFor="date">Ngày đi</Label>
          <Input id="date" type="date" min={vnToday()} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Giờ (nếu có)</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">Số ghế</Label>
          <NativeSelect id="seats" value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <Button type="submit" size="lg" className="md:col-span-12 md:justify-self-end">
        <SearchIcon /> Tìm chuyến
      </Button>
    </form>
  );
}
