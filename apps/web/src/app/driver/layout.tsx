import { RoleGuard } from '@/components/role-guard';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['DRIVER']}>{children}</RoleGuard>;
}
