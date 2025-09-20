import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
