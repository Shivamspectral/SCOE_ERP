import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsUUID() departmentId!: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsString() @MinLength(1) @MaxLength(80) rollNumber!: string;
  @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @IsString() @MinLength(2) @MaxLength(160) fullName!: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsIn(['active','inactive','graduated','transferred']) status?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) rollNumber?: string;
  @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) fullName?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsIn(['active','inactive','graduated','transferred']) status?: string;
}
