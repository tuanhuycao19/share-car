import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserDto } from '../../users/user.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lowerTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @Transform(lowerTrim)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  /** Số điện thoại Việt Nam, ví dụ 0912345678 */
  @Transform(trim)
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0' })
  phone: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72)
  password: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(100)
  fullName: string;

  /** Chỉ cho phép tự đăng ký PASSENGER hoặc DRIVER. ADMIN được tạo qua seed/CLI. */
  @ApiProperty({ enum: ['PASSENGER', 'DRIVER'] })
  @IsIn(['PASSENGER', 'DRIVER'])
  role: 'PASSENGER' | 'DRIVER';

  /** Số giấy phép lái xe — bắt buộc khi role = DRIVER */
  @Transform(trim)
  @ValidateIf((o: RegisterDto) => o.role === 'DRIVER')
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số giấy phép lái xe' })
  @MaxLength(30)
  licenseNumber?: string;
}

export class LoginDto {
  @Transform(lowerTrim)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: UserDto;
}
