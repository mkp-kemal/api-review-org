import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from 'prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';
import { ErrorCode } from 'src/common/error-code';
import { CheckoutDto } from 'src/auth/dto/checkout.dto';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  public readonly stripe: Stripe

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
    private emailService: EmailService
  ) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  async createSubscription(
    organizationId: string,
    plan: SubscriptionPlan,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });
    if (!organization) throw new NotFoundException(ErrorCode.ORGANIZATION_NOT_FOUND);

    if (organization.subscription) {
      throw new BadRequestException(ErrorCode.ORGANIZATION_ALREADY_HAS_ACTIVE_SUBSCRIPTION);
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
        stripeSubId: "-",
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

    if (session.mode !== 'subscription') return;

    const organizationId = session.metadata?.organizationId;
    const plan = session.metadata?.plan as SubscriptionPlan;
    const stripeCustomerId = session.customer as string;
    const stripeSubId = session.subscription as string;

    if (!organizationId || !plan || !stripeCustomerId || !stripeSubId) {
      this.logger.error('Missing metadata or IDs in checkout.session.completed');
      return;
    }

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

    if (!organization) throw new NotFoundException(ErrorCode.ORGANIZATION_NOT_FOUND);

    return {
      organizationId,
      subscription: organization.subscription || null,
    };
  }

  private getPriceIdForPlan(plan: SubscriptionPlan): string {
    switch (plan) {
      case SubscriptionPlan.PRO:
        return process.env.STRIPE_PRICE_PRO;
      case SubscriptionPlan.ELITE:
        return process.env.STRIPE_PRICE_ELITE;
      default:
        throw new BadRequestException(ErrorCode.INVALID_PLAN_OR_STRIPE_PRICE);
    }
  }

  async getCheckoutSessionn(body: CheckoutDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ForbiddenException(ErrorCode.USER_NOT_AUTHORIZED);
    }

    let priceId: string | undefined;
    priceId = this.getPriceIdForPlan(body.plan);

    if (!priceId) {
      throw new BadRequestException(ErrorCode.INVALID_PLAN_OR_STRIPE_PRICE);
    }

    let targetType: 'team' | 'organization' | null = null;
    let targetId: string | null = null;
    let targetName: string | null = null;

    if (body.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: body.teamId },
        include: { subscription: true },
      });

      if (!team) {
        throw new BadRequestException(ErrorCode.TEAM_NOT_FOUND);
      }


      const currentPlan = team.subscription?.plan;
      if (currentPlan) {
        const planOrder = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.ELITE];
        const currentIndex = planOrder.indexOf(currentPlan);
        const newIndex = planOrder.indexOf(body.plan);

        if (newIndex <= currentIndex) {
          throw new BadRequestException(ErrorCode.INVALID_PLAN_OR_STRIPE_PRICE);
        }
      }

      targetType = 'team';
      targetId = team.id;
      targetName = team.name;
    } else if (body.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: body.organizationId },
        include: { subscription: true },
      });

      if (!org) {
        throw new BadRequestException(ErrorCode.ORGANIZATION_NOT_FOUND);
      }


      const currentPlan = org.subscription?.plan;
      if (currentPlan) {
        const planOrder = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.ELITE];
        const currentIndex = planOrder.indexOf(currentPlan);
        const newIndex = planOrder.indexOf(body.plan);

        if (newIndex <= currentIndex) {
          throw new BadRequestException(ErrorCode.INVALID_PLAN_OR_STRIPE_PRICE);
        }
      }

      targetType = 'organization';
      targetId = org.id;
      targetName = org.name;
    } else {
      throw new BadRequestException(ErrorCode.SOMETHING_WENT_WRONG);
    }

    const session = await this.stripeService.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      metadata: {
        plan: body.plan,
        [targetType + 'Id']: targetId,
      },
      subscription_data: {
        metadata: {
          plan: body.plan,
          [targetType + 'Id']: targetId,
        },
      },
      success_url: `${process.env.APP_URL}/payment_success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment_cancel.html`,
    });

    await this.prisma.checkoutSession.create({
      data: {
        id: session.id,
        targetId,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        url: session.url,
        targetType,
        plan: body.plan,
      },
    });

    if (user.email) {
      await this.emailService.sendCheckoutPlan({
        email: user.email,
        date: new Date(),
        targetType,
        amount: session.amount_total,
        url: session.url,
        targetName,
        plan: body.plan,
        currency: session.currency,
      })
    }

    return { url: session.url };
  }


  async handleWebhook(req, res) {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!this.stripe) {
      return res.status(500).send('Service not available');
    }

    const rawBody = (req as any).rawBody || req.body;
    if (!rawBody) {
      return res.status(400).send('Raw body is required for webhook verification');
    }

    try {
      let event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );

      if (event.type === 'invoice.payment_succeeded') {

        const invoice = event.data.object as Stripe.Invoice & {
          parent?: {
            subscription_details?: {
              subscription?: string;
              metadata?: Record<string, string>;
            };
          };
          payment_intent?: string;
        };

        const subscriptionId = invoice.parent?.subscription_details?.subscription;

        if (!subscriptionId) {
          console.error("❌ No subscription ID found in invoice.parent.subscription_details", invoice.id);
          return res.status(400).send("Missing subscription ID");
        }

        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

        const newPlan = subscription.metadata.plan as SubscriptionPlan;
        const orgId = subscription.metadata.organizationId;
        const teamId = subscription.metadata.teamId;
        let targetId = "";

        if (!newPlan) {
          console.error("❌ Webhook Error: missing plan in subscription metadata");
          return res.status(400).send("Missing plan in metadata");
        }

        if (!orgId && !teamId) {
          console.error("❌ Webhook Error: no organizationId or teamId in subscription metadata");
          return res.status(400).send("Missing target ID in metadata");
        }

        await this.prisma.$transaction(async (tx) => {
          let subscriptionRecord;

          if (orgId) {
            targetId = orgId;
            subscriptionRecord = await tx.subscription.upsert({
              where: { organizationId: orgId },
              update: {
                plan: newPlan,
                stripeCustomerId: subscription.customer as string,
                stripeSubId: subscriptionId,
                status: "ACTIVE"
              },
              create: {
                organizationId: orgId,
                plan: newPlan,
                stripeCustomerId: subscription.customer as string,
                stripeSubId: subscriptionId,
                status: "ACTIVE"
              },
            });

          } else if (teamId) {
            targetId = teamId;
            subscriptionRecord = await tx.subscription.upsert({
              where: { teamId },
              update: {
                plan: newPlan,
                stripeCustomerId: subscription.customer as string,
                stripeSubId: subscriptionId,
                status: "ACTIVE"
              },
              create: {
                teamId,
                plan: newPlan,
                stripeCustomerId: subscription.customer as string,
                stripeSubId: subscriptionId,
                status: "ACTIVE"
              },
            });

          }

          const checkoutSessionRecord = await tx.checkoutSession.updateMany({
            where: { targetId: targetId },
            data: { status: 'paid' },
          });

          console.log(checkoutSessionRecord, "checkoutSessionRecord");

          if (subscriptionRecord) {
            console.log(subscriptionRecord, 'subscriptionRecord');

            await tx.subscriptionTransaction.create({
              data: {
                subscriptionId: subscriptionRecord.id,
                amount: invoice.total,
                currency: invoice.currency,
                status: 'paid',
                stripePaymentId: (invoice.payment_intent as string) || null,
              },
            });
          }
        });

      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ Webhook Error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  async getAllSubscriptionTransactions() {
    const transactions = await this.prisma.subscriptionTransaction.findMany({
      include: {
        subscription: { include: { organization: true, team: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customerIds = [
      ...new Set(transactions.map(t => t.subscription?.stripeCustomerId).filter(Boolean)),
    ];


    const customers = await Promise.all(
      customerIds.map(id =>
        this.stripe.customers.retrieve(id).catch(err => {
          console.warn(`⚠️ Failed to retrieve customer ${id}:`, err.message);
          return null;
        })
      )
    );
    const customerMap = new Map(customerIds.map((id, i) => [id, customers[i]]));


    const invoiceMap = new Map<string, Stripe.Invoice>();
    await Promise.all(
      transactions.map(async tx => {
        const id = tx.stripePaymentId;
        if (!id || !id.startsWith('in_')) return;

        try {
          const invoice = await this.stripe.invoices.retrieve(
            id
          ) as Stripe.Invoice;
          invoiceMap.set(id, invoice);
        } catch (err: any) {
          console.warn(`⚠️ Failed to retrieve invoice ${id}:`, err.message);
        }
      })
    );


    return transactions.map(tx => {
      const customer = tx.subscription?.stripeCustomerId
        ? customerMap.get(tx.subscription.stripeCustomerId)
        : null;

      const invoice = tx.stripePaymentId
        ? invoiceMap.get(tx.stripePaymentId)
        : null;


      const paymentMethods = invoice?.payment_settings?.payment_method_types ?? [];

      return {
        ...tx,
        customer,
        paymentMethods,
        invoice_pdf: invoice?.invoice_pdf ?? null,
        hosted_invoice_url: invoice?.hosted_invoice_url ?? null,
      };
    });
  }

  async getCheckoutSave(targetId: string, plan: SubscriptionPlan) {
    const team = await this.prisma.team.findUnique({ where: { id: targetId } });
    const organization = await this.prisma.organization.findUnique({ where: { id: targetId } });

    if (!team && !organization) {
      throw new BadRequestException(ErrorCode.INVALID_TARGET_ID);
    }

    const checkoutSession = await this.prisma.checkoutSession.findFirst({
      where: {
        targetId,
        status: 'unpaid',
        plan,
      },
      select: { url: true, id: true, plan: true, status: true, createdAt: true }
    });

    return checkoutSession || { message: 'No checkout session found for this target and plan', status: 400 };
  }



}





