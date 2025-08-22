import { IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Season } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'Amazing season!', description: 'Judul review' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'The team spirit was great and coaching solid.', description: 'Isi review' })
  @IsString()
  body: string;

  @ApiProperty({ enum: Season, example: 'FALL', description: 'Musim (enum dari Season)' })
  @IsEnum(Season)
  season_term: Season;

  @ApiProperty({ example: 2024, description: 'Tahun season' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  season_year: number;

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

  @ApiProperty({ example: 2, minimum: 1, maximum: 5 })
  @IsInt()
  safety: number;
}
