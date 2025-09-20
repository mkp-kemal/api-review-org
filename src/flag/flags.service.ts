import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FlagStatus, Role } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFlagDto } from 'src/auth/dto/create-flag.dto';
import { UpdateFlagDto } from 'src/auth/dto/update-flag.dto';
import { ErrorCode } from 'src/common/error-code';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class FlagsService {
  constructor(private prisma: PrismaService, private emailService: EmailService) { }

  async flagReview(reviewId: string, userId: string, dto: CreateFlagDto, ip: string) {

    let user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: userId,
          role: Role.ANONYMOUS,
          email: null,
          passwordHash: null,
          isVerified: false,
          lastLogin: new Date()
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actor: {
            connect: { id: userId || Role.ANONYMOUS }
          },
          action: 'CREATE',
          targetType: 'USER_ON_FLAG',
          targetId: reviewId,
          metadata: {
            reason: dto.reason,
          }
        },
      });
    }

    if (!reviewId) throw new BadRequestException(ErrorCode.REVIEW_ID_REQUIRED);
    if (!dto.reason) throw new BadRequestException(ErrorCode.REASON_REQUIRED);

    const review = await this.prisma.review.findUnique({ where: { id: reviewId }, include:{rating: true, team: true} });
    if (!review) throw new NotFoundException(ErrorCode.REVIEW_NOT_FOUND);

    const existing = await this.prisma.flag.findFirst({
      where: {
        reviewId,
        OR: [
          { reporterUserId: userId },
          { ip },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException(ErrorCode.ALREADY_FLAGGED_REVIEW);
    }

    await this.prisma.auditLog.create({
      data: {
        actor: { connect: { id: userId } },
        action: 'CREATE',
        targetType: 'FLAG',
        targetId: reviewId,
        metadata: {
          reason: dto.reason,
          ip,
        },
      },
    });

    await this.prisma.flag.create({
      data: {
        review: { connect: { id: reviewId } },
        reporter: { connect: { id: userId } },
        reason: dto.reason,
        ip,
      },
    });

    if (user.email) {
      await this.emailService.sendReviewsFlagged({
        email: user.email,
        date: new Date(),
        team: review.team.name,
        title: review.title,
        body: review.body,
        teamUrl: `${process.env.APP_URL}/Org_profile.html?id=${review.teamId}`,
        star: review.rating.overall,
      });
    }

    return {
      message: 'Flag successfully sent',
    };
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
    if (!flag) throw new NotFoundException(ErrorCode.FLAG_NOT_FOUND);
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
      throw new BadRequestException(ErrorCode.INVALID_FLAG_STATUS);
    }

    const result = await this.prisma.flag.update({
      where: { id },
      data: { status: dto.status },
    });

    return result;
  }
}
