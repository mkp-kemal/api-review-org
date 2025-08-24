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
async handleWebhook(@Req() req: Request, @Res() res: Response) {
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // 🔍 Debug tipe body
    console.log("typeof req.body:", typeof req.body);
    console.log("isBuffer:", Buffer.isBuffer(req.body));
    console.log("constructor:", req.body?.constructor?.name);

    console.log("Webhook Secret from env:", webhookSecret);
    console.log("Signature header:", signature);

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