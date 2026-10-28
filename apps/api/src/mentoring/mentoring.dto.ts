import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMentoringAssignmentDto {
  @IsUUID() studentId!: string;
  @IsUUID() facultyUserId!: string;
  @IsString() @MinLength(4) @MaxLength(32) academicYear!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class CreateMentoringMeetingDto {
  @IsOptional() @IsDateString() meetingAt?: string;
  @IsIn(['academic','attendance','career','wellbeing','discipline','other']) category!: string;
  @IsString() @MinLength(3) @MaxLength(10000) notes!: string;
  @IsOptional() @IsString() @MaxLength(5000) actionPlan?: string;
  @IsOptional() @IsDateString() followUpOn?: string;
}

export class UpdateMentoringMeetingDto {
  @IsOptional() @IsIn(['open','resolved']) status?: string;
  @IsOptional() @IsIn(['academic','attendance','career','wellbeing','discipline','other']) category?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(10000) notes?: string;
  @IsOptional() @IsString() @MaxLength(5000) actionPlan?: string;
  @IsOptional() @IsDateString() followUpOn?: string;
}
