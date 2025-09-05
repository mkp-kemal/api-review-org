import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ example: '123', description: 'Team ID' })
  @IsString()
  @IsOptional()
  teamId: string;

  @ApiProperty({ example: '123', description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId: string;

  @ApiProperty({ enum: SubscriptionPlan, example: 'BASIC', description: 'Plan' })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
