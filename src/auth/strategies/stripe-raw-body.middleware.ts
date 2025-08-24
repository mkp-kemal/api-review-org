import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class StripeRawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.startsWith('/billing/webhook')) {
      bodyParser.raw({ type: 'application/json' })(req, res, (err) => {
        if (err) {
          next(err);
        } else {
          (req as any).rawBody = req.body;
          next();
        }
      });
    } else {
      next();
    }
  }
}
