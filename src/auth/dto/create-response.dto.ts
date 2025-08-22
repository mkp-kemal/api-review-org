import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResponseDto {
  @ApiProperty({ example: 'We appreciate your feedback.', description: 'Isi response' })
  @IsNotEmpty()
  @IsString()
  body: string;
}
