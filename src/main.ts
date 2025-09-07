import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { StripeRawBodyMiddleware } from './auth/strategies/stripe-raw-body.middleware';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', true);

  app.enableCors({
    origin: [process.env.APP_URL_CORS],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // app.use(new StripeRawBodyMiddleware().use);
  
  // Add raw body for Stripe webhook
  app.use('/billing/webhook', bodyParser.raw({ type: 'application/json' }));

  // Enable class-validator globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // delete property not in DTO
      forbidNonWhitelisted: true, // if any property not in DTO, throw error
      transform: true, // transform data to DTO
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('CURVEBALL API')
    .setDescription('The Curveball API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
