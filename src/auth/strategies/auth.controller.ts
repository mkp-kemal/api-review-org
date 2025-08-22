import { Controller, Post, Body, UseGuards, Req, Get, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 200, description: 'Registered. Check your email to verify' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @Post('resend-verification-email')
  @Get('resend-verification-email')
  async resendVerificationEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.resendVerificationEmail(token);
  }

  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  }) @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'Get current logged in user' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    return req.user;
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('forgot-password')
  @ApiResponse({ status: 200, description: 'Password reset link sent to your email' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @ApiResponse({ status: 200, description: 'Password has been reset successfully' })
  @ApiBody({ type: ResetPasswordDto })
  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Req() req, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(req.user.userId, dto.newPassword);
  }

  @ApiResponse({ status: 200, description: 'Logout successful' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req, @Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  @ApiResponse({ status: 200, description: 'Password reset link sent to your email' })
  @Get('verify-password')
  async verifyPassword(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyPassword(token);
  }

  @ApiOperation({ summary: 'Check if user is authenticated' })
  @UseGuards(JwtAuthGuard)
  @Get('check')
  async check(@Req() req) {
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
