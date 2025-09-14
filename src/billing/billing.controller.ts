import { Controller, Post, Get, Req, Res, Body, Param, BadRequestException, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Request, Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';
import { StripeService } from 'src/stripe/stripe.service';
import { PrismaService } from 'prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { ErrorCode } from 'src/common/error-code';
import { CheckoutDto } from 'src/auth/dto/checkout.dto';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { AuditLog } from 'src/audit/audit-log.decorator';

interface StripeRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  public readonly stripe: Stripe
  constructor(private readonly billingService: BillingService, private readonly stripeService: StripeService, private readonly prisma: PrismaService) { }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    return this.billingService.handleWebhook(req, res);
  }

  @ApiOperation({ summary: 'Create a new subscription (with checkout)' })
  @AuditLog("CREATE", "CHEKOUT_SESSION")
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @Post('checkout-session')
  async createCheckoutSession(
    @Body() body: CheckoutDto,
    @Req() req
  ) {
    return this.billingService.getCheckoutSessionn(body, req.user.userId);
  }

  @Get('status/:organizationId')
  @ApiOperation({ summary: 'Get subscription status for an organization' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getSubscriptionStatus(@Param('organizationId') organizationId: string) {
    return this.billingService.getSubscriptionStatus(organizationId);
  }


  @Get('checkout-session')
  async getCheckoutSession(@Query('session_id') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('session_id is required');
    }

    const session = await this.stripeService.attachSubscriptionToDb(sessionId);
    return session;
  }

  @Get('transactions')
  async getTransactions() {
    return this.billingService.getAllSubscriptionTransactions();
  }
}