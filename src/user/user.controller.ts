import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // Get current user profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  // (Optional) Admin only: list all users
  @UseGuards(JwtAuthGuard) // add role guard if needed
  @Get()
  async listUsers() {
    return this.userService.findAll();
  }
}
