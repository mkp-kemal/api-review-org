import { Controller, Post, Body, UseGuards, Req, Get, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from './role-guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('resend-verification-email')
  @Get('resend-verification-email')
  async resendVerificationEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.resendVerificationEmail(token);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    return req.user;
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request reset password dengan email' })
  @ApiResponse({ status: 200, description: 'Link reset password telah dikirim ke email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }


  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Req() req, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(req.user.userId, dto.newPassword);
  }


  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req, @Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  async check(@Req() req) {
    // Kalau sampai sini berarti token valid
    return {
      isAuthenticated: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}
