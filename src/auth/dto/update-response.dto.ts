import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateResponseDto {
  @ApiProperty({ example: 'The coaching staff were excellent.', description: 'Isi review' })
  @IsOptional()
  @IsString()
  body?: string;
}