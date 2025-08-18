// dto/create-flag.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateResponseReviewDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
