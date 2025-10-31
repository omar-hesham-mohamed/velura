import { IsEmail, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateOAuthUserDto {
  @IsNotEmpty()
  @IsIn(['GOOGLE', 'FACEBOOK'])
  provider: string;

  @IsNotEmpty()
  providerId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsNotEmpty()
  name: string;
}
