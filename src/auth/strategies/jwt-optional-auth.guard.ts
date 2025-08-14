import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // Kalau token valid → user terisi
    // Kalau tidak ada token → user = null
    return user || null;
  }
}
