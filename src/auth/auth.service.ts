import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private emailService: EmailService,
    ) { }

    async register(dto: RegisterDto) {
        // Cek email sudah terdaftar
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new BadRequestException('Email already registered');

        // Hash password
        const hash = await bcrypt.hash(dto.password, 12);

        // Buat user baru dengan isVerified false
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash: hash,
                isVerified: false,
                createdAt: new Date(),
            },
        });

        // Buat token verifikasi dengan secret khusus email verification
        const verifyToken = this.jwt.sign(
            { sub: user.id },
            { secret: this.config.get('JWT_EMAIL_VERIFICATION_SECRET'), expiresIn: '1d' },
        );

        // Kirim email verifikasi
        await this.emailService.sendVerificationEmail(user.email, verifyToken);

        return { message: 'Registered. Check your email to verify.' };
    }


    async validateUser(email: string, pass: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(pass, user.passwordHash);
        if (!ok) return null;
        return user;
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        if (!user.isVerified) throw new ForbiddenException('Email not verified');

        const accessToken = await this.signAccessToken(user.id, user.role, user.email);
        const refresh = await this.createRefreshToken(user.id);

        return { accessToken, refreshToken: refresh.token };
    }

    private async signAccessToken(userId: string, role: string, email: string) {
        return this.jwt.signAsync(
            { sub: userId, role, email },
            { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') },
        );
    }

    private async createRefreshToken(userId: string) {
        // create DB record first to get id
        const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d';
        const expiresAt = new Date(Date.now() + this.msFromExpString(expiresIn));
        const record = await this.prisma.refreshToken.create({
            data: { userId, expiresAt },
        });

        // sign JWT with jti = record.id
        const token = await this.jwt.signAsync(
            { sub: userId, jti: record.id },
            { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn },
        );

        return { id: record.id, token, expiresAt };
    }

    async refreshToken(token: string) {
        try {
            const payload = this.jwt.verify(token, { secret: this.config.get('JWT_REFRESH_SECRET') }) as any;
            const tokenId = payload.jti;
            const userId = payload.sub;
            if (!tokenId || !userId) throw new UnauthorizedException();

            const stored = await this.prisma.refreshToken.findUnique({ where: { id: tokenId } });
            if (!stored || stored.revoked) throw new UnauthorizedException();
            if (stored.expiresAt < new Date()) throw new UnauthorizedException();

            // rotate: revoke old and create new
            await this.prisma.refreshToken.update({ where: { id: tokenId }, data: { revoked: true } });
            const newRefresh = await this.createRefreshToken(userId);
            const accessToken = await this.signAccessToken(userId, (await this.prisma.user.findUnique({ where: { id: userId } })).role, (await this.prisma.user.findUnique({ where: { id: userId } })).email);

            return { accessToken, refreshToken: newRefresh.token };
        } catch (err) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async forgotPassword(email: string) {

        if (!email) throw new BadRequestException('Email is required');
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException('Email not found');
        if (!user.isVerified) throw new ForbiddenException('Email not verified');

        // Buat token reset password (expire 1 jam)
        const token = this.jwt.sign(
            { sub: user.id },
            { secret: this.config.get('JWT_RESET_PASSWORD_SECRET'), expiresIn: '1h' },
        );

        // Kirim email reset password
        await this.emailService.sendResetPasswordEmail(email, token);

        return { message: 'Password reset link sent to your email' };
    }

    async resetPassword(token: string, newPassword: string) {
        let payload: any;
        try {
            payload = this.jwt.verify(token, { secret: this.config.get('JWT_RESET_PASSWORD_SECRET') });
        } catch (e) {
            throw new BadRequestException('Invalid or expired token');
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) throw new NotFoundException('User not found');

        const hashed = await bcrypt.hash(newPassword, 12);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashed },
        });

        return { message: 'Password has been reset successfully' };
    }

    async logout(tokenId: string) {
        await this.prisma.refreshToken.updateMany({
            where: { id: tokenId },
            data: { revoked: true },
        });
        return { message: 'Logged out' };
    }

    private msFromExpString(exp: string): number {
        // supports formats like "7d", "15m"
        const num = parseInt(exp.slice(0, -1), 10);
        const unit = exp.slice(-1);
        if (unit === 'd') return num * 24 * 60 * 60 * 1000;
        if (unit === 'h') return num * 60 * 60 * 1000;
        if (unit === 'm') return num * 60 * 1000;
        if (unit === 's') return num * 1000;
        return 7 * 24 * 60 * 60 * 1000;
    }

    async verifyEmail(token: string) {
        let payload: any;
        try {
            payload = this.jwt.verify(token, {
                secret: this.config.get('JWT_EMAIL_VERIFICATION_SECRET'),
            });
        } catch (error) {
            throw new BadRequestException('Invalid or expired token');
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) throw new NotFoundException('User not found');

        if (user.isVerified) return { message: 'Email already verified' };

        await this.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        });

        return { message: 'Email verified successfully' };
    }
}
