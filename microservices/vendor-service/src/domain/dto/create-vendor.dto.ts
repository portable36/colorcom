import { IsString, IsEmail, IsOptional, IsUrl, MinLength } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  slug: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  bankAccount?: string;

  @IsOptional()
  taxId?: string;
}
