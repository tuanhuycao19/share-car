'use client';

import { useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Location } from '@share-car/api-client';
import { MapPinIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounced } from '@/hooks/use-debounced';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Chọn địa điểm có gợi ý.
 * ⚠️ MOCK: gợi ý lấy từ GET /places — danh sách địa điểm cố định ở backend
 * (apps/api/src/maps/mock-places.ts). Sau này thay bằng dịch vụ geocoding/bản đồ thật.
 */
export function PlacePicker({
  label,
  value,
  onChange,
  placeholder = 'Nhập tỉnh, bến xe, địa danh...',
  required,
}: {
  label: string;
  value: Location | null;
  onChange: (value: Location | null) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(value?.address ?? '');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const q = useDebounced(text);

  const places = useQuery({
    queryKey: ['places', q],
    queryFn: async () => (await api.GET('/places', { params: { query: { q } } })).data!,
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const select = (loc: Location) => {
    onChange(loc);
    setText(loc.address);
    setOpen(false);
  };

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <MapPinIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          id={id}
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
          className="pl-9"
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
        />
      </div>
      {open && (
        <ul
          className="bg-popover absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border p-1 shadow-md"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {places.isPending && <li className="text-muted-foreground px-3 py-2 text-sm">Đang tìm...</li>}
          {places.data?.length === 0 && (
            <li className="text-muted-foreground px-3 py-2 text-sm">Không tìm thấy địa điểm</li>
          )}
          {places.data?.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={cn(
                  'hover:bg-accent w-full rounded-sm px-3 py-2 text-left text-sm',
                  value?.address === p.address && 'bg-accent',
                )}
                onClick={() => select({ address: p.address, lat: p.lat, lng: p.lng })}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground text-xs">{p.address}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
