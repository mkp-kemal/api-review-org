import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { ReviewModule } from './review/review.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/strategies/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    ReviewModule,
    EmailModule,
  ],
})
export class AppModule {}
