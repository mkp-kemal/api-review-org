import { reviewsPosted } from "./template-html";

export type requiremenetsEmail = {
    to: string,
    from: string
    subject: string,
    html: string,
}

export function templateVerifEmailHTML(token: string): string {
    const verifyUrl = `${process.env.APP_URL}/email_ver.html?token=${token}`;

    return `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`;
}

export function templateResetPassEmailHTML(token: string): string {
    const resetUrl = `${process.env.APP_URL}/forgot-pass.html?token=${token}`;

    return `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`;
}

export function templateReviewsPosted(config){
    return reviewsPosted(config);
}