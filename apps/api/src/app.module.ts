import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CircularsModule } from './circulars/circulars.module';
import { AttendanceModule } from './attendance/attendance.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AcademicModule } from './academic/academic.module';
import { MarksModule } from './marks/marks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().port().default(4000),
        WEB_ORIGIN: Joi.string().required(),
        SUPABASE_URL: Joi.string().uri().required(),
        SUPABASE_PUBLISHABLE_KEY: Joi.string().min(1).required(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    HealthModule,
    AuthModule,
    DepartmentsModule,
    WorkflowsModule,
    NotificationsModule,
    CircularsModule,
    AttendanceModule,
    UsersModule,
    StudentsModule,
    AcademicModule,
    MarksModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
