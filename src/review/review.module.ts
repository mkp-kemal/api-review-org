import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ReviewController } from './review.controller';

@Module({
  imports: [PrismaModule],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
