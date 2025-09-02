import { Controller, Post, Get, Req, Res, Body, Param, BadRequestException, UseGuards, ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Request, Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';
import { StripeService } from 'src/stripe/stripe.service';
import { PrismaService } from 'prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { ErrorCode } from 'src/common/error-code';

interface StripeRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService, private readonly stripeService: StripeService, private readonly prisma: PrismaService) { }

  // @Post('subscribe')
  // @ApiOperation({ summary: 'Create a new subscription (with checkout)' })
  // async subscribe(@Body() subscribeDto: { organizationId: string; plan: SubscriptionPlan }) {
  //   return this.billingService.createSubscription(
  //     subscribeDto.organizationId,
  //     subscribeDto.plan,
  //   );
  // }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      let event = Stripe.webhooks.constructEvent(
        (req as any).body,
        signature,
        webhookSecret
      );

      console.log('EVENT123456789', event.type);

      if (event.type === 'checkout.session.completed') {
        console.log('✅ Checkout session completed:', event.data.object);
      } else if (event.type === 'invoice.payment_succeeded') {
        console.log('✅ Invoice paid:', event.data.object);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ Webhook Error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Create a new subscription (with checkout)' })
  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(
    @Body()
    body: {
      plan: string;
      teamId?: string;
      organizationId?: string;
    },
    @Req() req: Request
  ) {

    const user = (req.user as any);

    if (!user) {
      throw new ForbiddenException(ErrorCode.USER_NOT_AUTHORIZED);
    }

    // ✅ Validasi plan → mapping ke Stripe price ID
    let priceId: string | undefined;

    if (body.plan === SubscriptionPlan.PRO) {
      priceId = process.env.STRIPE_PRICE_PRO;
    } else if (body.plan === SubscriptionPlan.ELITE) {
      priceId = process.env.STRIPE_PRICE_ELITE;
    }

    if (!priceId) {
      throw new BadRequestException(ErrorCode.INVALID_PLAN_OR_STRIPE_PRICE);
    }

    // ✅ Validasi target entity
    let targetType: 'team' | 'organization' | null = null;
    let targetId: string | null = null;

    if (body.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: body.teamId },
      });
      if (!team) {
        throw new BadRequestException(ErrorCode.TEAM_NOT_FOUND);
      }
      targetType = 'team';
      targetId = team.id;
    } else if (body.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: body.organizationId },
      });
      if (!org) {
        throw new BadRequestException(ErrorCode.ORGANIZATION_NOT_FOUND);
      }
      targetType = 'organization';
      targetId = org.id;
    } else {
      throw new BadRequestException(ErrorCode.SOMETHING_WENT_WRONG);
    }

    if (targetType === "organization") {
      if (user.role !== Role.ORG_ADMIN) {
        throw new ForbiddenException(ErrorCode.ACCESS_FORBIDDEN);
      }
    }


    // ✅ Buat Stripe checkout session
    const session = await this.stripeService.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan: body.plan,
        [targetType + 'Id']: targetId,
      },
      success_url: `${process.env.APP_URL}/Blog.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing/cancel`,
    });

    return { url: session.url };
  }

  @Get('status/:organizationId')
  @ApiOperation({ summary: 'Get subscription status for an organization' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getSubscriptionStatus(@Param('organizationId') organizationId: string) {
    return this.billingService.getSubscriptionStatus(organizationId);
  }
}