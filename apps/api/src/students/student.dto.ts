import { IsEmail, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsUUID() departmentId!: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsString() @MinLength(1) @MaxLength(40) rollNumber!: string;
  @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateStudentDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(40) rollNumber?: string;
  @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsIn(['active','inactive','graduated','transferred']) status?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
