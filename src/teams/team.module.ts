import { Module } from "@nestjs/common";
import { PrismaModule } from "prisma/prisma.module";
import { TeamService } from "./team.service";
import { TeamController } from "./teams.controller";
import { StripeService } from "src/stripe/stripe.service";
import { EmailModule } from "src/email/email.module";

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [TeamService, StripeService],
  controllers: [TeamController],
  exports: [TeamService],
})
export class TeamModule {}
