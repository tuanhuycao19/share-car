import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Đánh dấu route không cần đăng nhập. Mặc định mọi route đều yêu cầu JWT. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
