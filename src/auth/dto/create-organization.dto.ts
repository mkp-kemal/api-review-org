import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrganizationDto {
  @ApiProperty({ example: 'OpenAI', description: 'Nama organisasi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'San Francisco', description: 'Kota organisasi' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'California', description: 'Provinsi/State organisasi' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'https://openai.com', description: 'Website organisasi' })
  @IsString()
  website: string;

  @ApiProperty({ example: 'user-123', required: false, description: 'User ID yang mengklaim organisasi (opsional)' })
  @IsString()
  @IsOptional()
  claimedById?: string;
}
