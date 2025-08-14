import { IsBoolean, IsOptional } from 'class-validator';

export class AdminReviewDto {
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}