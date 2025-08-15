import { Controller, Post, Get, Req, Res, Body, Param } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Request, Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscribeDto } from 'src/auth/dto/subscribe.dto';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from 'prisma/prisma.service';

interface StripeRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService, private prisma : PrismaService) { }

  @Post('subscribe')
  @ApiOperation({ summary: 'Create a new subscription (with checkout)' })
  async subscribe(@Body() subscribeDto: { organizationId: string; plan: SubscriptionPlan }) {
    return this.billingService.createSubscription(
      subscribeDto.organizationId,
      subscribeDto.plan,
    );
  }

  @Post('webhook')
  async handleWebhook(@Req() req: StripeRequest, @Res() res: Response) {
   try {
     const body = req.body;
     const headerList = req.headers;

     const signature = headerList['stripe-signature'] as string;
     const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

     if(!webhookSecret) throw new Error('Stripe webhook secret is not set');

     const event = Stripe.webhooks.constructEvent(body, signature, webhookSecret);

     if (event.type === 'checkout.session.completed') {
      console.log('Checkout session completed:', event.data.object);
      
    }

    res.status(200).json({ received: true });
   } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
   } 
  }

  @Get('status/:organizationId')
  @ApiOperation({ summary: 'Get subscription status for an organization' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getSubscriptionStatus(@Param('organizationId') organizationId: string) {
    return this.billingService.getSubscriptionStatus(organizationId);
  }
}