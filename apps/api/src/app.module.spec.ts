import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { AppModule } from './app.module';

describe('AppModule dependency graph', () => {
  let app: INestApplicationContext | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('boots every registered module and resolves controller providers', async () => {
    app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    expect(app).toBeDefined();
  });
});
