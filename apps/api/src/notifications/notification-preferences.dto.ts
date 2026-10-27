import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean()
  emailAlerts?: boolean;

  @IsOptional() @IsBoolean()
  smsAlerts?: boolean;

  @IsOptional() @IsBoolean()
  attendanceWarnings?: boolean;
}
