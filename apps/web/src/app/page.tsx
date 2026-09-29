import { ShieldCheckIcon, UsersIcon, WalletIcon } from 'lucide-react';
import { SearchForm } from '@/components/search-form';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  { icon: UsersIcon, title: 'Ghép khách thông minh', text: 'Gợi ý chuyến đi qua điểm đón/trả của bạn, đúng giờ, đủ ghế.' },
  { icon: WalletIcon, title: 'Giá rõ ràng', text: 'Giá mỗi ghế do tài xế niêm yết, hệ thống tính tổng tiền minh bạch.' },
  { icon: ShieldCheckIcon, title: 'Tài xế được duyệt', text: 'Chỉ tài xế đã được quản trị viên xác minh mới được đăng chuyến.' },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Đặt xe ghép 5 chỗ, 7 chỗ</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl md:mx-0">
          Tìm chuyến xe ghép liên tỉnh phù hợp với lộ trình của bạn và đặt ghế chỉ trong vài bước.
        </p>
      </section>

      <Card>
        <CardContent>
          <SearchForm />
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-3 rounded-xl border bg-white/60 p-4">
            <f.icon className="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">{f.title}</p>
              <p className="text-muted-foreground text-sm">{f.text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
