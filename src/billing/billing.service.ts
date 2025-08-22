import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from 'prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) { }

  async createSubscription(
    organizationId: string,
    plan: SubscriptionPlan,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });
    if (!organization) throw new NotFoundException('Organization not found');

    if (organization.subscription) {
      throw new BadRequestException('Organization already has an active subscription');
    }

    let customerId: string;

    if (organization.subscription?.status === SubscriptionStatus.ACTIVE) {
      customerId = organization.subscription.stripeCustomerId;
    } else {
      const customer = await this.stripeService.createCustomer(
        organization.name,
        organizationId,
      );
      customerId = customer.id;
    }

    const priceId = this.getPriceIdForPlan(plan);

    const session = await this.stripeService.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        organizationId,
        plan,
      },
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel`,
    });

    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: customerId,
        stripeSubId: "twertyu", // nanti diisi real stripe subId
      },
    });

    return { checkoutUrl: session.url, subscriptionId: subscription.id };
  }


  async confirmPayment(paymentIntentId: string) {
    const paymentIntent = await this.stripeService.confirmPaymentIntent(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    // Pastikan ini mode subscription
    if (session.mode !== 'subscription') return;

    const organizationId = session.metadata?.organizationId;
    const plan = session.metadata?.plan as SubscriptionPlan;
    const stripeCustomerId = session.customer as string;
    const stripeSubId = session.subscription as string;

    if (!organizationId || !plan || !stripeCustomerId || !stripeSubId) {
      this.logger.error('Missing metadata or IDs in checkout.session.completed');
      return;
    }

    // Simpan subscription di DB
    await this.prisma.subscription.create({
      data: {
        organizationId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubId,
      },
    });

    this.logger.log(`Subscription created for org ${organizationId}`);
  }



  async handleStripeWebhook(rawBody: Buffer | string, signature: string) {
    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }


  private async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubId: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }


  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.lines?.data?.[0]?.subscription as string;
    if (!subscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { stripeSubId: subscriptionId },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
  }


  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.lines?.data?.[0]?.subscription as string;
    if (!subscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { stripeSubId: subscriptionId },
      data: { status: SubscriptionStatus.ACTIVE },
    });
  }


  async getSubscriptionStatus(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    if (!organization) throw new NotFoundException('Organization not found');

    return {
      organizationId,
      subscription: organization.subscription || null,
    };
  }


  private getPriceIdForPlan(plan: SubscriptionPlan): string {
    switch (plan) {
      case SubscriptionPlan.BASIC:
        return "price_1RwBhNPUzeicXwggiM9ig5b4";
      case SubscriptionPlan.PRO:
        return process.env.STRIPE_PRO_PRICE_ID;
      case SubscriptionPlan.ELITE:
        return process.env.STRIPE_ELITE_PRICE_ID;
      default:
        throw new Error('Invalid plan');
    }
  }
}
