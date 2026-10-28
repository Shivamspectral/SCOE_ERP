import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateLibraryBookDto {
  @IsOptional() @IsString() @MaxLength(32) isbn?: string;
  @IsString() @MinLength(1) @MaxLength(240) title!: string;
  @IsString() @MinLength(1) @MaxLength(180) author!: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(180) publisher?: string;
  @IsOptional() @IsInt() @Min(1400) @Max(2200) publicationYear?: number;
  @IsInt() @Min(0) @Max(100000) totalCopies!: number;
  @IsOptional() @IsString() @MaxLength(80) shelfLocation?: string;
}
export class UpdateLibraryBookDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(240) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(180) author?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(180) publisher?: string;
  @IsOptional() @IsInt() @Min(1400) @Max(2200) publicationYear?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(100000) totalCopies?: number;
  @IsOptional() @IsString() @MaxLength(80) shelfLocation?: string;
  @IsOptional() @IsIn(['active','archived']) status?: string;
}
export class IssueLibraryLoanDto {
  @IsUUID() bookId!: string;
  @IsUUID() studentId!: string;
  @IsISO8601() dueAt!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
