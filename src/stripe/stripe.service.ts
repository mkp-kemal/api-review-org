import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  public readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
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

      // Attach jika belum terattach
      if (!paymentMethod.customer) {
        await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      }

      // Set sebagai default payment method
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
      setup_future_usage: 'off_session', // <- ini penting
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
}
