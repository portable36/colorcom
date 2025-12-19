import { IsString, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';

export class StoreSettingDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsObject()
  shippingPolicy?: any;

  @IsOptional()
  @IsObject()
  returnPolicy?: any;
}
