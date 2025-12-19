import { IsString, IsObject, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class PayoutConfigDto {
  @IsString()
  method: string;

  @IsObject()
  details: any;

  @IsOptional()
  @IsNumber()
  scheduleDays?: number;

  @IsOptional()
  @IsNumber()
  minPayout?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
