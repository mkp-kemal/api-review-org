import { IsString, IsEnum, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { Season } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiProperty({ example: 'Great season experience', description: 'Judul review' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'The coaching staff were excellent.', description: 'Isi review' })
  @IsString()
  body: string;

  @ApiProperty({ enum: Season, example: 'SPRING', description: 'Musim (enum dari Season)' })
  @IsEnum(Season)
  season_term: Season;

  @ApiProperty({ example: 2025, description: 'Tahun season (2000 - 2100)' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  season_year: number;

  @ApiProperty({ example: 'U18', description: 'Level usia pada saat review' })
  @IsString()
  age_level_at_review: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  coaching: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  development: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 5 })
  @IsInt()
  transparency: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  culture: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  safety: number;

  @ApiProperty({ example: true, required: false, description: 'Apakah review dipublikasikan' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateReviewStatusDto {
  @ApiProperty({ example: true, description: 'Status publikasi review' })
  @IsBoolean()
  isPublic: boolean;
}
