import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateResponseDto } from 'src/auth/dto/create-response.dto';
import { UpdateResponseDto } from 'src/auth/dto/update-response.dto';

@Injectable()
export class ResponsesService {
  constructor(private prisma: PrismaService) {}

  async createResponse(reviewId: string, userId: string, dto: CreateResponseDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { team: true }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.orgResponse.create({
      data: {
        reviewId,
        orgUserId: userId,
        body: dto.body
      }
    });
  }

  async updateResponse(id: string, userId: string, dto: UpdateResponseDto) {
    const response = await this.prisma.orgResponse.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            team: true
          }
        }
      }
    });

    if (!response) {
      throw new NotFoundException('Response not found');
    }

    return this.prisma.orgResponse.update({
      where: { id },
      data: dto
    });
  }

  async deleteResponse(id: string, userId: string) {
    const response = await this.prisma.orgResponse.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            team: true
          }
        }
      }
    });

    if (!response) {
      throw new NotFoundException('Response not found');
    }

    return this.prisma.orgResponse.delete({
      where: { id }
    });
  }
}