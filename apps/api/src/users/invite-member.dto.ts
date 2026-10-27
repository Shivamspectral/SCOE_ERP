import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class InviteMemberDto {
  @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsString() @MaxLength(32)
  phone?: string;

  @IsIn(['Super Admin','Administrator','Coordinator','Vice-Principal','HOD','Faculty','Staff','administrator','coordinator','hod','faculty','staff'])
  role!: string;

  @IsOptional() @IsUUID()
  departmentId?: string;

  @IsOptional() @IsUUID()
  responsibilityId?: string;
}
