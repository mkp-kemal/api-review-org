import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken') || ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    const userId = payload.sub;
    const tokenId = payload.jti; // we'll set jti as token id in refresh token
    if (!userId || !tokenId) throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });
    if (!stored || stored.revoked) throw new UnauthorizedException();

    // Note: we store hashed token in DB, but since JWT refresh contains no raw token,
    // we rely on token id (jti) + verifying signature => acceptable approach.
    return { userId, tokenId };
  }
}
