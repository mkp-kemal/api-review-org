import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty()
  @IsString()
  paymentMethodId: string;
}