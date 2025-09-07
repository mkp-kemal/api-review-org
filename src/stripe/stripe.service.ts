import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class StripeService {
  public readonly stripe: Stripe;
  constructor(private configService: ConfigService, private prisma: PrismaService) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-07-30.basil', // Latest stable version
      typescript: true,
    });
  }

  // === PAYMENT METHODS ===
  async attachAndSetDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.customer && paymentMethod.customer !== customerId) {
        throw new Error('Payment method already attached to another customer');
      }

      // Attach if not already attached
      if (!paymentMethod.customer) {
        await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      }

      // Set as default
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      return { success: true };
    } catch (error) {
      console.error(`Payment method attachment failed: ${error.message}`);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    return this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    return this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  // === CUSTOMER ===
  async createCustomer(name: string, organizationId: string) {
    return this.stripe.customers.create({
      name,
      metadata: { organizationId },
    });
  }

  // === PAYMENT INTENT ===
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    paymentMethodId?: string,
    setupFutureUsage: Stripe.PaymentIntent.SetupFutureUsage | null = 'off_session'
  ) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      setup_future_usage: 'off_session', // important
      automatic_payment_methods: { enabled: true },
    });
  }

  // === SUBSCRIPTION ===
  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete', // Recommended for SCA
      expand: ['latest_invoice.payment_intent'],
    });
  }

  // === WEBHOOK ===
  constructWebhookEvent(rawBody: Buffer | string, signature: string) {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.configService.get('STRIPE_WEBHOOK_SECRET'),
    );
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  async getCheckoutSession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.default_payment_method'],
    });

    const subscription = session.subscription as Stripe.Subscription;

    let team = null;
    if (session.metadata?.teamId) {
      team = await this.prisma.team.findUnique({
        where: { id: session.metadata.teamId },
      });
    }

    let organization = null;
    if (session.metadata?.organizationId) {
      organization = await this.prisma.organization.findUnique({
        where: { id: session.metadata.organizationId },
      });
    }

    // get payment method
    const pm = subscription?.default_payment_method as Stripe.PaymentMethod;
    let method = null;

    if (pm?.type === 'card') {
      method = `${pm.card?.brand.toUpperCase()} •••• ${pm.card?.last4} (exp ${pm.card?.exp_month}/${pm.card?.exp_year})`;
    } else {
      method = pm?.type || null;
    }

    return {
      email: session.customer_details?.email || null,
      targetName: team?.name || organization?.name || null,
      amount_total: session.amount_total,
      method, // format: VISA •••• 4242 (exp 12/2034)
      currency: session.currency,
      plan: session.metadata.plan || "-",
      created: new Date(session.created * 1000),
    };
  }


  async attachSubscriptionToDb(sessionId: string) {
    const session = await this.getCheckoutSession(sessionId);

    return session;
  }
}
