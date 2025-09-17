import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ReviewController } from './review.controller';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
