import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString() @MinLength(2) @MaxLength(200)
  title!: string;

  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority!: string;

  @IsOptional() @IsDateString()
  dueAt?: string;

  @IsOptional() @IsString() @MaxLength(80)
  category?: string;

  @IsOptional() @IsUUID()
  departmentId?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsIn(['draft', 'completed'])
  status?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  title?: string;

  @IsOptional() @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @IsOptional() @IsDateString()
  dueAt?: string;

  @IsOptional() @IsString() @MaxLength(80)
  category?: string;
}
