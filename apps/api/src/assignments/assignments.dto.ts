import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID() classId!: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(5000) instructions?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000) maxMarks?: number;
}

export class UpsertAssignmentSubmissionDto {
  @IsUUID() studentId!: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000) marks?: number;
  @IsOptional() @IsString() @MaxLength(3000) feedback?: string;
  @IsOptional() @IsString() @MaxLength(1000) submissionRef?: string;
  @IsOptional() @IsIn(['pending','submitted','evaluated','returned','late']) status?: 'pending' | 'submitted' | 'evaluated' | 'returned' | 'late';
}

export class UpdateAssignmentStatusDto {
  @IsIn(['draft','published','closed','archived']) status!: 'draft' | 'published' | 'closed' | 'archived';
}
