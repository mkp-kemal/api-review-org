import { IsString, IsEnum, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { Season } from '@prisma/client';

export class CreateReviewDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(Season)
  season: Season;

  @IsInt()
  @Min(1)
  @Max(5)
  coaching: number;

  @IsInt()
  @Min(1)
  @Max(5)
  development: number;

  @IsInt()
  @Min(1)
  @Max(5)
  transparency: number;

  @IsInt()
  @Min(1)
  @Max(5)
  culture: number;

  @IsInt()
  @Min(1)
  @Max(5)
  safety: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
