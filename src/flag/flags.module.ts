import { Module } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { FlagsController } from './flags.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FlagsController],
  providers: [FlagsService, PrismaService],
})
export class FlagsModule {}
