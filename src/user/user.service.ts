import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ErrorCode } from 'src/common/error-code';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isVerified: true, isBanned: true, createdAt: true },
    });

    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true, isVerified: true, isBanned: true, lastLogin: true, createdAt: true },
    });
  }

  async ban(id: string, status: 'ban' | 'unban') {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    return this.prisma.user.update({
      where: { id },
      data: { isBanned: status === 'ban' },
      select: { id: true, email: true, role: true, isVerified: true, isBanned: true, createdAt: true },
    });
  }

  async deleteMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (user.isDeleted) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true },
    })

    return {
      message: `User ${user.email} deleted successfully`,
    }
  }
}
