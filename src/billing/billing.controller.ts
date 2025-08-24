import { Controller, Post, Get, Req, Res, Body, Param, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Request, Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';
import { StripeService } from 'src/stripe/stripe.service';

interface StripeRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService, private readonly stripeService: StripeService) { }

  // @Post('subscribe')
  // @ApiOperation({ summary: 'Create a new subscription (with checkout)' })
  // async subscribe(@Body() subscribeDto: { organizationId: string; plan: SubscriptionPlan }) {
  //   return this.billingService.createSubscription(
  //     subscribeDto.organizationId,
  //     subscribeDto.plan,
  //   );
  // }

  @Post('webhook')
  async handleWebhook(@Req() req: StripeRequest, @Res() res: Response) {
    try {
      const body = req.body;
      const headerList = req.headers;

      const signature = headerList['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) throw new Error('Stripe webhook secret is not set');

      const event = Stripe.webhooks.constructEvent(body, signature, webhookSecret);

      console.log(event, 'ass');


      if (event.type === 'checkout.session.completed') {
        console.log('Checkout session completed:', event.data.object);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }

  @ApiOperation({ summary: 'Create a new subscription (with checkout)' })
  @Post('checkout-session')
  async createCheckoutSession(@Body() body: { plan: string; organizationId: string }) {
    let priceId: string | undefined;

    if (body.plan === SubscriptionPlan.PRO) {
      priceId = process.env.STRIPE_PRICE_PRO;
    } else if (body.plan === SubscriptionPlan.ELITE) {
      priceId = process.env.STRIPE_PRICE_ELITE;
    }

    if (!priceId) {
      throw new BadRequestException('Stripe price ID is not set');
    }

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
        organizationId: body.organizationId,
        plan: body.plan,
      },
      success_url: `${process.env.APP_URL}/Blog.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'http://localhost:3000/cancel',
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