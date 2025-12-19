import { IsString, IsOptional } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  dataType?: string;
}

export class UpdateAttributeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  dataType?: string;
}
