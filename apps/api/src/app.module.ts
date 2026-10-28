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
import { DashboardModule } from './dashboard/dashboard.module';
import { MarksModule } from './marks/marks.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';
import { TasksModule } from './tasks/tasks.module';
import { FacultyModule } from './faculty/faculty.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().port().default(4000),
        WEB_ORIGIN: Joi.string().default('http://localhost:5173'),
        // Supabase is optional for bootstrapping health/docs. Data/auth routes
        // explicitly return 503 until the provider is configured.
        SUPABASE_URL: Joi.string().uri().optional(),
        SUPABASE_PUBLISHABLE_KEY: Joi.string().min(1).optional(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),
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
    DashboardModule,
    MarksModule,
    DocumentsModule,
    AuditModule,
    TasksModule,
    FacultyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
