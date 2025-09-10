import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/types';

export class RegisterDto {
  @ApiProperty({ example: 'Ismail Abdullah' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ismail.abdullah@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  role: UserRole;
}
