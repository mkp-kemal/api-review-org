import { IsNotEmpty, IsString } from 'class-validator';

export class CreateResponseDto {
  @IsNotEmpty()
  @IsString()
  body: string;
}