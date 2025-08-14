import { IsBoolean, IsOptional } from 'class-validator';

export class AdminUserDto {
  @IsBoolean()
  @IsOptional()
  isBanned?: boolean;
}