// flags.service.ts
import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { FlagStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFlagDto } from 'src/auth/dto/create-flag.dto';
import { UpdateFlagDto } from 'src/auth/dto/update-flag.dto';

@Injectable()
export class FlagsService {
  constructor(private prisma: PrismaService) {}

  async flagReview(reviewId: string, userId: string, dto: CreateFlagDto) {
    // Validate userId exists
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Check review exists
    const review = await this.prisma.review.findUnique({ 
      where: { id: reviewId } 
    });
    if (!review) throw new NotFoundException('Review not found');

    // Check user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.flag.create({
      data: {
        review: { connect: { id: reviewId } },
        reporter: { connect: { id: userId } },
        reason: dto.reason,
      },
    });
}

  async listFlags() {
    return this.prisma.flag.findMany({
      include: {
        review: {
          include: { team: true, user: true },
        },
        reporter: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFlag(id: string) {
    const flag = await this.prisma.flag.findUnique({
      where: { id },
      include: {
        review: {
          include: { team: true, user: true },
        },
        reporter: true,
      },
    });
    if (!flag) throw new NotFoundException('Flag not found');
    return flag;
  }

  async resolveFlag(id: string) {
    return this.prisma.flag.update({
      where: { id },
      data: { status: FlagStatus.RESOLVED },
    });
  }

 async updateFlagStatus(id: string, dto: UpdateFlagDto) {
  if (!Object.values(FlagStatus).includes(dto.status)) {
    throw new BadRequestException('Invalid status value');
  }
  
  const result = await this.prisma.flag.update({
    where: { id },
    data: { status: dto.status },
  });

  return result;
}
}
