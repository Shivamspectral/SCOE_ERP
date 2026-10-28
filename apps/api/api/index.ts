import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

let handlerPromise: Promise<(req: Request, res: Response) => unknown> | undefined;

async function createHandler() {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter, { bufferLogs: true });
  const config = app.get(ConfigService);
  const origins = (config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173')
    .split(',').map((item) => item.trim()).filter(Boolean);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  const openApi = new DocumentBuilder()
    .setTitle('Astra+ Campus API')
    .setDescription('Internal college operations API. Authorization is enforced by the API and Supabase RLS.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openApi);
  SwaggerModule.setup('api/v1/docs', app, document, { jsonDocumentUrl: 'api/v1/openapi.json' });
  await app.init();
  return adapter.getInstance() as (req: Request, res: Response) => unknown;
}

export default async function handler(req: Request, res: Response) {
  try {
    handlerPromise ??= createHandler();
    const appHandler = await handlerPromise;
    return appHandler(req, res);
  } catch (error) {
    handlerPromise = undefined;
    console.error('API bootstrap failed', error);
    return res.status(503).json({
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'API configuration is incomplete. Configure the required service environment variables.',
    });
  }
}
