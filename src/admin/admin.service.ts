import { Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createObjectCsvStringifier } from 'csv-writer';
import { Response } from 'express';
import { PrismaService } from 'prisma/prisma.service';
import { AdminReviewDto } from 'src/auth/dto/admin-review.dto';
import { AdminUserDto } from 'src/auth/dto/admin-user.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }
  // Reviews
  async getAllReviews() {
    return this.prisma.review.findMany({
      include: {
        user: true,
        team: true,
        rating: true
      }
    });
  }

  async toggleReviewVisibility(reviewId: string, dto: AdminReviewDto) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isPublic: dto.isPublic }
    });
  }

  // Users
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        flags: true,
        reviews: true,
        orgClaims: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async toggleUserBan(targetUserId: string, dto: AdminUserDto, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new ForbiddenException("You cannot ban yourself.");
    }
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: dto.isBanned }
    });
  }

  // Export
  async exportReviewsToCsv(res: Response) {

    const reviews = await this.prisma.review.findMany({
      include: {
        user: true,
        team: {
          include: {
            organization: true  // Include organization data
          }
        }
      }
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: 'Title' },
        { id: 'body', title: 'Content' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'organizationName', title: 'Organization' },  // Changed from teamName
        { id: 'teamDivision', title: 'Team Division' },
        { id: 'createdAt', title: 'Date' }
      ]
    });

    const records = reviews.map(review => ({
      id: review.id,
      title: review.title,
      body: review.body,
      userEmail: review.user.email,
      organizationName: review.team.organization.name,  // Access organization name
      teamDivision: `${review.team.ageLevel} ${review.team.division}`, // Example format
      createdAt: review.createdAt.toISOString()
    }));

    res.header('Content-Type', 'text/csv');
    res.attachment('reviews.csv');
    return res.send(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records));
  }

  async exportFlagsToCsv(res: Response) {
    const flags = await this.prisma.flag.findMany({
      include: {
        review: true,
        reporter: true
      }
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'reason', title: 'Reason' },
        { id: 'status', title: 'Status' },
        { id: 'reviewTitle', title: 'Review Title' },
        { id: 'reporterEmail', title: 'Reporter' },
        { id: 'createdAt', title: 'Date' }
      ]
    });

    const records = flags.map(flag => ({
      id: flag.id,
      reason: flag.reason,
      status: flag.status,
      reviewTitle: flag.review.title,
      reporterEmail: flag.reporter.email,
      createdAt: flag.createdAt.toISOString()
    }));

    res.header('Content-Type', 'text/csv');
    res.attachment('flags.csv');
    return res.send(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records));
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      select: {
        action: true,
        targetType: true,
        metadata: true,
        actor: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async deleteAuditLogs (){
    return this.prisma.auditLog.deleteMany();
  }
}