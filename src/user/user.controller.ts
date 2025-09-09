import { Controller, Get, Param, UseGuards, Req, Patch, BadRequestException, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/auth/strategies/role-guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) { }

  @ApiOkResponse({
    description: 'User profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-1234-5678' },
        email: { type: 'string', example: 'user@example.com' },
        role: { type: 'string', example: 'ADMIN' },
        isVerified: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2025-08-22T08:00:00.000Z' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  @ApiOkResponse({
    description: 'List of users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-1234-5678' },
          email: { type: 'string', example: 'user@example.com' },
          role: { type: 'string', example: 'ADMIN' },
          isVerified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time', example: '2025-08-22T08:00:00.000Z' },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Get('all')
  async listAllUsers() {
    return this.userService.findAll();
  }
  
  @ApiParam({
      name: 'status',
      enum: ['ban', 'unban'],
      required: true,
    })
    @ApiBody({
      schema: {
        properties: {
          id: { type: 'string', example: 'uuid-1234-5678' },
        },
        required: ['teamId', 'files'],
      },
    })
  @AuditLog('UPDATE', 'USERS_ISBANNED')
  @Patch(':id/:status')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  async banUser(@Param('id') id: string, @Param('status') status: 'ban' | 'unban') {
    if (status !== 'ban' && status !== 'unban') {
          throw new BadRequestException('Invalid status');
        }
    
    return this.userService.ban(id, status);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(@Req() req) {
    return this.userService.deleteMe(req.user.userId);
  }
}
