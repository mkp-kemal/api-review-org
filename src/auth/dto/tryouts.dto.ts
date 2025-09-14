import { IsOptional, IsString } from 'class-validator';

export class TryoutsDto {
  @IsString()
  title: string;

  @IsString()
  datetime: string;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  urlregister?: string;
}
