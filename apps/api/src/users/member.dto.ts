import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @IsOptional() @IsIn(['Super Admin','Administrator','Coordinator','Vice-Principal','HOD','Faculty','Staff','administrator','coordinator','hod','faculty','staff'])
  role?: string;
  @IsOptional() @IsIn(['pending','active','suspended']) status?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() responsibilityId?: string;
}

