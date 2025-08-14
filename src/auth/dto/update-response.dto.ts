import { IsOptional, IsString } from 'class-validator';

export class UpdateResponseDto {
  @IsOptional()
  @IsString()
  body?: string;
}