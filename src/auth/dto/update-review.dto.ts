import { IsString, IsEnum, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { Season } from '@prisma/client';

export class UpdateReviewDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(Season)
  season_term: Season;

  @IsInt()
  @Min(2000) // contoh minimal tahun
  @Max(2100) // contoh maksimal tahun
  season_year: number;

  @IsString()
  age_level_at_review: string;

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

