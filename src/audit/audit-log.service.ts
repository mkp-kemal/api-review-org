import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    actorUserId: string,
    dto: {
      action: string;
      targetType: string;
      targetId?: string;
      metadata?: any;
    }
  ) {
    try {
      // Prepare data with proper typing
      const data: Prisma.AuditLogCreateInput = {
        actor: {
          connect: { id: actorUserId || 'ANONYMOUS' }
        },
        action: dto.action,
        targetType: dto.targetType,
        targetId: dto.targetId || 'multiple',
        metadata: dto.metadata ? this.sanitizeMetadata(dto.metadata) : undefined
      };

      return await this.prisma.auditLog.create({ data });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Fail silently for production, or implement your error handling strategy
      return null;
    }
  }

  private sanitizeMetadata(metadata: any): Prisma.JsonValue {
    // Remove sensitive data and ensure JSON serialization
    const { password, passwordHash, token, ...cleanData } = metadata;
    return cleanData as Prisma.JsonValue;
  }
}