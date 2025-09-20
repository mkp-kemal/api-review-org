import { configEmailParamsCheckout, configEmailParamsClaim } from "./template-verification-email";

export function reviewsPosted(config) {
    const {
        email,
        date,
        title,
        body,
        star,
        team,
        teamUrl
    } = config;

    const renderStars = (rating) => {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);


        stars += '★'.repeat(fullStars);

        if (hasHalf) stars += '⯪';

        stars += '☆'.repeat(emptyStars);

        return stars;
    };

    return `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        
                        <!-- Container -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                    <img src="https://curveball-image.s3.ap-southeast-2.amazonaws.com/Curveball_Critiques_Logo_bgrmv.png" alt="Curveball" style="max-width: 150px; height: auto;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: #333333;">⭐ New Reviews Posted!</h1>
                                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 20px 0;">
                                        Halo <strong>${email}</strong>,<br>
                                        Thanks for your review, we really appreciate it. Below is the summary of your review:
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Review Card -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; border: 1px solid #eeeeee;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Name Team: <strong>${team}</strong></p>
                                                <p style="margin: 10px 0 5px; font-size: 14px; color: #777777;">Date: <strong>${new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date(date))} UTC</strong></p>
                                                <p style="margin: 0; font-size: 20px; color: #FFD700;">${renderStars(star)}</p>
                                                <p style="margin: 5px 0 0; font-size: 18px; color: #333333;">${title}</p>
                                                <p style="margin: 20px 0 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                                    “${body}”
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 30px 40px; text-align: center;">
                                    <a href="${teamUrl}" 
                                    style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                        View Review
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 20px 40px; text-align: center; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Curveball. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </body>
        `;
}

export function reviewsFlagged(config) {
    const {
        email,
        date,
        title,
        body,
        star,
        team,
        teamUrl
    } = config;

    const renderStars = (rating) => {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);


        stars += '★'.repeat(fullStars);

        if (hasHalf) stars += '⯪';

        stars += '☆'.repeat(emptyStars);

        return stars;
    };

    return `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        
                        <!-- Container -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                    <img src="https://curveball-image.s3.ap-southeast-2.amazonaws.com/Curveball_Critiques_Logo_bgrmv.png" alt="Curveball" style="max-width: 150px; height: auto;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: #333333;">😊 Flag Received !</h1>
                                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 20px 0;">
                                        Halo <strong>${email}</strong>,<br>
                                        Thanks for your flag, we will review it as soon as possible.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Review Card -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; border: 1px solid #eeeeee;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Name Team: <strong>${team}</strong></p>
                                                <p style="margin: 10px 0 5px; font-size: 14px; color: #777777;">Date: <strong>${new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date(date))} UTC</strong></p>
                                                <p style="margin: 0; font-size: 20px; color: #FFD700;">${renderStars(star)}</p>
                                                <p style="margin: 5px 0 0; font-size: 18px; color: #333333;">${title}</p>
                                                <p style="margin: 20px 0 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                                    “${body}”
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 30px 40px; text-align: center;">
                                    <a href="${teamUrl}" 
                                    style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                        View Review
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 20px 40px; text-align: center; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Curveball. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </body>
        `;
}

export function orgClaim(config: configEmailParamsClaim) {
    const {
        email,
        date,
        nameOrg,
        adminUrl
    } = config;

    return `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        
                        <!-- Container -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                    <img src="https://curveball-image.s3.ap-southeast-2.amazonaws.com/Curveball_Critiques_Logo_bgrmv.png" alt="Curveball" style="max-width: 150px; height: auto;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: #333333;">🎉 Claimed Organization !</h1>
                                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 20px 0;">
                                        Halo <strong>${email}</strong>,<br>
                                        The organization <strong>${nameOrg}</strong> has been claimed!
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Review Card -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; border: 1px solid #eeeeee;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Name Organization: <strong>${nameOrg}</strong></p>
                                                <p style="margin: 10px 0 5px; font-size: 14px; color: #777777;">Date: <strong>${new Intl.DateTimeFormat('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                }).format(new Date(date))} UTC</strong></p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 30px 40px; text-align: center;">
                                    <a href="${adminUrl}" 
                                    style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                        View Organization
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 20px 40px; text-align: center; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Curveball. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </body>
        `;
}

export function teamClaim(config: configEmailParamsClaim) {
    const {
        email,
        emailto,
        date,
        nameOrg,
        adminUrl
    } = config;

    return `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        
                        <!-- Container -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                    <img src="https://curveball-image.s3.ap-southeast-2.amazonaws.com/Curveball_Critiques_Logo_bgrmv.png" alt="Curveball" style="max-width: 150px; height: auto;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: #333333;">🎉 Claimed Organization !</h1>
                                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 20px 0;">
                                        Halo <strong>${emailto}</strong>,<br>
                                        The team <strong>${nameOrg}</strong> has been claimed by ${email}!
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Review Card -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; border: 1px solid #eeeeee;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Name Team: <strong>${nameOrg}</strong></p>
                                                <p style="margin: 10px 0 5px; font-size: 14px; color: #777777;">Date: <strong>${new Intl.DateTimeFormat('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                }).format(new Date(date))} UTC</strong></p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 30px 40px; text-align: center;">
                                    <a href="${adminUrl}" 
                                    style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                        View Team
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 20px 40px; text-align: center; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Curveball. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </body>
        `;
}

export function teamClaimByMe(config: configEmailParamsClaim) {
    const {
        email,
        emailto,
        date,
        nameOrg,
        adminUrl
    } = config;

    return `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        
                        <!-- Container -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                    <img src="https://curveball-image.s3.ap-southeast-2.amazonaws.com/Curveball_Critiques_Logo_bgrmv.png" alt="Curveball" style="max-width: 150px; height: auto;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: #333333;">🎉 Claimed Team by ${email} !</h1>
                                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 20px 0;">
                                        Halo <strong>${emailto}</strong>,<br>
                                        The team <strong>${nameOrg}</strong> has been claimed to you by ${email}!
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Review Card -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; border: 1px solid #eeeeee;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Name Team: <strong>${nameOrg}</strong></p>
                                                <p style="margin: 10px 0 5px; font-size: 14px; color: #777777;">Date: <strong>${new Intl.DateTimeFormat('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                }).format(new Date(date))} UTC</strong></p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 30px 40px; text-align: center;">
                                    <a href="${adminUrl}" 
                                    style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                        View Team
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 20px 40px; text-align: center; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Curveball. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </body>
        `;
}

export function checkoutPlan(config: configEmailParamsCheckout) {
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

    return `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        
                        <!-- Container -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                    <img src="https://curveball-image.s3.ap-southeast-2.amazonaws.com/Curveball_Critiques_Logo_bgrmv.png" 
                                        alt="Curveball" 
                                        width="150" 
                                        style="display:block; border:0; outline:none; text-decoration:none; max-width:150px; height:auto;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: #333333;">🎉 Subscribe Plan!</h1>
                                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 20px 0;">
                                        Halo <strong>${email}</strong>,<br>
                                        Thanks for subscribing to <strong>${plan}</strong> plan!
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Review Card -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 8px; padding: 20px; border: 1px solid #eeeeee;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Name ${targetType === 'team' ? 'Team' : 'Organization'}: <strong>${targetName}</strong></p>
                                                <p style="margin: 0; font-size: 14px; color: #777777;">Amount: <strong>${amount} ${currency}</strong></p>
                                                <p style="margin: 10px 0 5px; font-size: 14px; color: #777777;">Date: <strong>${new Intl.DateTimeFormat('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                }).format(new Date(date))} UTC</strong></p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 30px 40px; text-align: center;">
                                    <a href="${url}" 
                                    style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                        Get Payment
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 20px 40px; text-align: center; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Curveball. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </body>
        `;
}