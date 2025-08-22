import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

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
  @AuditLog('READ', 'USER_PROFILE')
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
  @AuditLog('READ', 'USERS')
  @UseGuards(JwtAuthGuard)
  @Get()
  async listUsers() {
    return this.userService.findAll();
  }
}
