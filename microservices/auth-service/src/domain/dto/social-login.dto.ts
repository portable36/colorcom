import { IsString, IsIn, IsOptional } from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsIn(['google', 'facebook'])
  provider: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
