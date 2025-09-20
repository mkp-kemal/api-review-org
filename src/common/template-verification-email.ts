import { SubscriptionPlan } from "@prisma/client";
import { checkoutPlan, orgClaim, reviewsFlagged, reviewsPosted, teamClaim, teamClaimByMe } from "./template-html";

export type requiremenetsEmail = {
    to: string,
    from: string
    subject: string,
    html: string,
}

export type configEmailParamsReviews = {
    email: string,
    date: any,
    title: string,
    body: string,
    star: number,
    team: string,
    teamUrl: string,
}

export type configEmailParamsClaim = {
    email: string,
    date: any,
    nameOrg: string,
    adminUrl: string,
    emailto: string
}

export type configEmailParamsCheckout = {
    email: string,
    date: any,
    targetType: string,
    amount: number,
    url: string,
    plan: SubscriptionPlan,
    currency: string,
    targetName: string,
}

export function templateVerifEmailHTML(token: string): string {
    const verifyUrl = `${process.env.APP_URL}/email_ver.html?token=${token}`;

    return `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`;
}

export function templateResetPassEmailHTML(token: string): string {
    const resetUrl = `${process.env.APP_URL}/forgot-pass.html?token=${token}`;

    return `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`;
}

export function templateReviewsPosted(config: configEmailParamsReviews){
    return reviewsPosted(config);
}

export function templateReviewsFlagged(config: configEmailParamsReviews){
    return reviewsFlagged(config);
}

export function templateOrgClaim(config: configEmailParamsClaim){
    return orgClaim(config);
}

export function templateTeamClaim(config: configEmailParamsClaim){
    return teamClaim(config);
}

export function templateTeamClaimByMe(config: configEmailParamsClaim){
    return teamClaimByMe(config);
}

export function templateCheckoutPlan(config: configEmailParamsCheckout){
    return checkoutPlan(config);
}