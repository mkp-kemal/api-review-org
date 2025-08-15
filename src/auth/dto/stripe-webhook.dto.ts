import { IsString } from "class-validator";

export class StripeWebhookDto {
  @IsString()
  signature: string;

  rawBody: Buffer;
}