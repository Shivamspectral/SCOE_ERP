import { IsArray, IsDateString, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SubmitWorkflowDto {
  @IsIn(['task','leave','department','faculty','syllabus','timetable','attendance','examination','circular','events','documents','quality','policy','report','other'])
  module!: string;

  @IsString() @MinLength(3) @MaxLength(160)
  title!: string;

  @IsOptional() @IsString() @MaxLength(4000)
  description?: string;

  @IsOptional() @IsUUID()
  departmentId?: string;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsIn(['low','normal','high','urgent'])
  priority?: string;

  @IsOptional() @IsDateString()
  dueAt?: string;

  @IsOptional() @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  approverIds?: string[];
}

export class DecideWorkflowDto {
  @IsIn(['approve','return','reject'])
  decision!: 'approve' | 'return' | 'reject';

  @IsOptional() @IsString() @MaxLength(1000)
  comment?: string;
}
