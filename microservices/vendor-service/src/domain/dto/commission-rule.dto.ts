import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CommissionRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  rate: number;

  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  type?: string;

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  active?: boolean;
}
