import { RoleGuard } from '@/components/role-guard';

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['PASSENGER']}>{children}</RoleGuard>;
}
