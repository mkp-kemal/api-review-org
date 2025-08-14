import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { AuditLog } from 'src/audit/audit-log.decorator';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  @AuditLog('READ', 'USERS')
  @UseGuards(JwtAuthGuard) // add role guard if needed
  @Get()
  async listUsers() {
    return this.userService.findAll();
  }
}
