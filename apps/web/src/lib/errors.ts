import { ApiError } from '@share-car/api-client';

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return 'Không kết nối được máy chủ. Vui lòng thử lại.';
  if (err instanceof Error) return err.message;
  return 'Đã có lỗi xảy ra';
}
