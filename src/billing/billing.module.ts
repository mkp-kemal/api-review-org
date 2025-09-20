import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { StripeModule } from '../stripe/stripe.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { BillingController } from './billing.controller';
import { OrganizationModule } from 'src/organization/organization.module';
import { StripeService } from 'src/stripe/stripe.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [OrganizationModule, StripeModule, ConfigModule, EmailModule],
  controllers: [BillingController],
  providers: [BillingService, PrismaService, StripeService],
  exports: [BillingService],
})
export class BillingModule {}