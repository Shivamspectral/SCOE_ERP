import { ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceSessionDto {
  @IsUUID() classId!: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsOptional() @IsDateString() sessionDate?: string;
  @IsOptional() @IsString() @MaxLength(120) sessionLabel?: string;
  @IsOptional() @IsString() @MaxLength(32) academicYear?: string;
  @IsOptional() semester?: number;
  @IsOptional() lectureNo?: number;
}

export class AttendanceRecordInput {
  @IsUUID() studentId!: string;
  @IsIn(['present','absent','late','excused','on_duty']) status!: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class SaveAttendanceRecordsDto {
  @IsArray() @ArrayMinSize(1) @ArrayUnique((record: AttendanceRecordInput) => record.studentId)
  @ValidateNested({ each: true }) @Type(() => AttendanceRecordInput)
  records!: AttendanceRecordInput[];
}
