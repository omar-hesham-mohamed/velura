import { IsEmail, IsNotEmpty, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  name: string;

  @IsIn(['LOCAL', 'GOOGLE', 'FACEBOOK'])
  provider?: 'LOCAL' | 'GOOGLE' | 'FACEBOOK';
}
