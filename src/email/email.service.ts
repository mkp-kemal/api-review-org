import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { configEmailParamsCheckout, configEmailParamsClaim, configEmailParamsReviews, requiremenetsEmail, templateCheckoutPlan, templateOrgClaim, templateResetPassEmailHTML, templateReviewsFlagged, templateReviewsPosted, templateTeamClaim, templateTeamClaimByMe, templateVerifEmailHTML } from 'src/common/template-verification-email';

@Injectable()
export class EmailService {
    constructor(private config: ConfigService) {
        const apiKey = this.config.get('SENDGRID_API_KEY');
        if (!apiKey) {
            throw new InternalServerErrorException('SendGrid API key is not set');
        }
        sgMail.setApiKey(apiKey);
    }

    async sendVerificationEmail(email: string, token: string) {
        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Verify your email',
            html: templateVerifEmailHTML(token)
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send verification email');
        }
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Reset your password',
            html: templateResetPassEmailHTML(token)
        };
        await sgMail.send(msg);
    }

    async sendReviewsPost(config: configEmailParamsReviews) {
        const {
            email,
            date,
            title,
            body,
            star,
            teamUrl
        } = config;

        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Reviews Posted',
            html: templateReviewsPosted(config)
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send email reviews');
        }
    }

    async sendReviewsFlagged(config: configEmailParamsReviews) {
        const {
            email,
            date,
            title,
            body,
            star,
            teamUrl
        } = config;

        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Reviews Flagged',
            html: templateReviewsFlagged(config)
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send email reviews');
        }
    }

    async sendOrgClaim(config: configEmailParamsClaim) {
        const {
            email,
            date,
            nameOrg,
            adminUrl
        } = config;

        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Claimed Organization',
            html: templateOrgClaim(config)
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send email reviews');
        }
    }

    async sendOrgClaimTeam(config: configEmailParamsClaim) {
        const {
            email,
            date,
            nameOrg,
            adminUrl,
            emailto
        } = config;

        const msg: requiremenetsEmail = {
            to: emailto,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: `Claimed Team by ${email}`,
            html: templateTeamClaim(config)
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send email reviews');
        }
    }

    async sendOrgClaimTeamToMe(config: configEmailParamsClaim) {
        const {
            email,
            date,
            nameOrg,
            adminUrl,
            emailto,
        } = config;

        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: `Claimed Team to ${emailto}`,
            html: templateTeamClaimByMe(config)
        };

        await sgMail.send(msg);
    }


    async sendCheckoutPlan(config: configEmailParamsCheckout) {
        const {
            email,
            date,
            amount,
            currency,
            targetType,
            url,
            targetName,
            plan
        } = config;

        const msg: requiremenetsEmail = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Checkout Plan',
            html: templateCheckoutPlan(config)
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send checkout plan');
        }
    }
}
