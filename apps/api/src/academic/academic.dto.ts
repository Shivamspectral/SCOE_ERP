import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateAcademicClassDto {
  @IsUUID() departmentId!: string;
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(32) academicYear?: string;
  @IsOptional() @IsInt() @Min(1) @Max(6) yearOfStudy?: number;
  @IsOptional() @IsString() @MaxLength(16) division?: string;
  @IsOptional() @IsIn(['degree','diploma']) programLevel?: string;
}

export class CreateAcademicSubjectDto {
  @IsUUID() departmentId!: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsString() @MaxLength(32) code?: string;
  @IsString() @MinLength(2) @MaxLength(140) name!: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) semester?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) credits?: number;
}

export class CreateTimetableEntryDto {
  @IsUUID() departmentId!: string;
  @IsString() @MinLength(2) @MaxLength(120) subject!: string;
  @IsString() @MinLength(1) @MaxLength(80) cohort!: string;
  @IsOptional() @IsString() @MaxLength(80) room?: string;
  @IsInt() @Min(1) @Max(7) dayOfWeek!: number;
  @Matches(timePattern) startsAt!: string;
  @Matches(timePattern) endsAt!: string;
  @IsOptional() @IsUUID() facultyId?: string;
}

export class CreateSyllabusProgressDto {
  @IsUUID() departmentId!: string;
  @IsString() @MinLength(2) @MaxLength(120) subject!: string;
  @IsString() @MinLength(2) @MaxLength(120) unit!: string;
  @IsInt() @Min(0) @Max(1000) plannedHours!: number;
  @IsOptional() @IsInt() @Min(0) @Max(1000) completedHours?: number;
}

export class UpdateSyllabusProgressDto {
  @IsOptional() @IsInt() @Min(0) @Max(1000) plannedHours?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1000) completedHours?: number;
  @IsOptional() @IsIn(['draft','submitted','reviewed','returned']) reviewStatus?: string;
}
