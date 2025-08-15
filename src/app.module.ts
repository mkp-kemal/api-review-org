import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { ReviewModule } from './review/review.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/strategies/auth.module';
import { SearchModule } from './search/search.module';
import { FlagsModule } from './flag/flags.module';
import { ResponsesModule } from './response/responses.module';
import { AdminModule } from './admin/admin.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './audit/audit-log.interceptor';
import { AuditLogModule } from './audit/audit-log.module';
import { BillingModule } from './billing/billing.module';
import { StripeModule } from './stripe/stripe.module';


@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    ReviewModule,
    EmailModule,
    SearchModule,
    FlagsModule,
    ResponsesModule,
    AdminModule,
    AuditLogModule,
    BillingModule,
    StripeModule,
  ],
})
export class AppModule {}
