import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateMarksRecordDto {
  @IsUUID() studentId!: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsString() @MinLength(2) @MaxLength(120) assessmentName!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) maxMarks!: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) marksObtained?: number;
}

export class UpdateMarksRecordDto {
  @IsUUID() id!: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) marksObtained?: number;
  @IsOptional() @IsString() @MaxLength(2000) feedback?: string;
}

export class MarkLockDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
