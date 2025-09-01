import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateResponseDto } from 'src/auth/dto/create-response.dto';
import { UpdateResponseDto } from 'src/auth/dto/update-response.dto';
import { ErrorCode } from 'src/common/error-code';

@Injectable()
export class ResponsesService {
  constructor(private prisma: PrismaService) { }

  async createResponse(
    reviewId: string,
    userId: string,
    dto: CreateResponseDto
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { team: { include: { subscription: true } } }
    });

    if (!review) throw new NotFoundException(ErrorCode.REVIEW_NOT_FOUND);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    const organization = await this.prisma.organization.findUnique({
      where: { id: review.team.organizationId },
      include: { subscription: true }
    });
    if (!organization) throw new NotFoundException(ErrorCode.ORGANIZATION_NOT_FOUND);

    // Tentukan plan efektif
    const teamPlan = review.team.subscription?.plan;
    const orgPlan = organization.subscription?.plan;

    const effectivePlan = teamPlan || orgPlan;

    if (!['PRO', 'ELITE'].includes(effectivePlan)) {
      throw new ForbiddenException(ErrorCode.PLAN_NOT_SUPPORTED);
    }

    return this.prisma.orgResponse.create({
      data: {
        reviewId,
        orgUserId: userId,
        body: dto.body
      }
    });
  }

  async updateResponse(
    id: string,
    userId: string,
    dto: UpdateResponseDto
  ) {
    // 1. get response
    const response = await this.prisma.orgResponse.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            team: { include: { subscription: true } }
          }
        }
      }
    });

    if (!response) throw new NotFoundException(ErrorCode.RESPONSE_NOT_FOUND);

    // 2. get user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    // 3. get organization
    const organization = await this.prisma.organization.findUnique({
      where: { id: response.review.team.organizationId },
      include: { subscription: true }
    });
    if (!organization) throw new NotFoundException(ErrorCode.ORGANIZATION_NOT_FOUND);

    // 4. Determine the effective plan (team > org)
    const teamPlan = response.review.team.subscription?.plan;
    const orgPlan = organization.subscription?.plan;
    const effectivePlan = teamPlan || orgPlan;

    // 5. determine if plan is supported
    if (!['PRO', 'ELITE'].includes(effectivePlan)) {
      throw new ForbiddenException(ErrorCode.PLAN_NOT_SUPPORTED);
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