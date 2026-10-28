import { Module } from '@nestjs/common';
import { MentoringController } from './mentoring.controller';

@Module({ controllers: [MentoringController] })
export class MentoringModule {}
