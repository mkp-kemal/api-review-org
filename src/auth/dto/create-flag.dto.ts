import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFlagDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
