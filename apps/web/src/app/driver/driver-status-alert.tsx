'use client';

import { ClockIcon, XCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';

/** Nhắc tài xế khi hồ sơ chưa được duyệt (backend vẫn chặn đăng chuyến). */
export function DriverStatusAlert() {
  const { user } = useAuth();
  const profile = user?.driverProfile;
  if (!profile || profile.status === 'APPROVED') return null;
  if (profile.status === 'PENDING') {
    return (
      <Alert variant="warning" className="mb-6">
        <ClockIcon />
        <AlertTitle>Hồ sơ tài xế đang chờ duyệt</AlertTitle>
        <AlertDescription>
          Bạn có thể thêm xe trước. Sau khi quản trị viên duyệt, bạn mới đăng được chuyến.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive" className="mb-6">
      <XCircleIcon />
      <AlertTitle>Hồ sơ tài xế bị từ chối</AlertTitle>
      <AlertDescription>{profile.rejectReason ?? 'Vui lòng liên hệ quản trị viên.'}</AlertDescription>
    </Alert>
  );
}
