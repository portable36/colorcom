import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class SearchProductsDto {
  @IsString()
  query: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  take?: number = 20;
}
