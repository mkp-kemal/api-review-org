import { IsEnum, IsNotEmpty } from 'class-validator';
import { FlagStatus } from '@prisma/client';

export class UpdateFlagDto {
  @IsNotEmpty()
  @IsEnum(FlagStatus)
  status: FlagStatus;
}