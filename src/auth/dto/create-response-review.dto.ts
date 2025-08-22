import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResponseReviewDto {
  @ApiProperty({ example: 'Thank you for your detailed review!', description: 'Isi response dari review' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
