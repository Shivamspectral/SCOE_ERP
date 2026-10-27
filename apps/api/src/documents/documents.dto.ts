import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsIn(['general','academic','policy','finance','student','staff','quality']) category!: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}

export class UpdateDocumentDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsIn(['general','academic','policy','finance','student','staff','quality']) category?: string;
  @IsOptional() @IsIn(['draft','active','archived']) status?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}
