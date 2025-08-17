import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

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
        // const verifyUrl = `${this.config.get('APP_URL')}/auth/verify-email?token=${token}`;
        const verifyUrl = `${this.config.get('APP_URL')}/email_ver.html?token=${token}`;
        const msg = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Verify your email',
            html: `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`,
        };

        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error('SendGrid send error:', error);
            throw new InternalServerErrorException('Failed to send verification email');
        }
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const resetUrl = `${this.config.get('APP_URL')}/forgot-pass.html?token=${token}`;
        const msg = {
            to: email,
            from: this.config.get('SENDGRID_FROM_EMAIL'),
            subject: 'Reset your password',
            html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`,
        };
        await sgMail.send(msg);
    }
}
