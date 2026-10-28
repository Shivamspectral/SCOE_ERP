import { IsIn, IsISO8601, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFeeStructureDto {
  @IsOptional() @IsUUID() departmentId?: string;
  @IsString() @MinLength(4) @MaxLength(20) academicYear!: string;
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) amount!: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
}
export class CreateFeeInvoiceDto {
  @IsUUID() studentId!: string;
  @IsOptional() @IsUUID() feeStructureId?: string;
  @IsString() @MinLength(1) @MaxLength(64) invoiceNumber!: string;
  @IsString() @MinLength(1) @MaxLength(240) description!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amountDue!: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsISO8601() dueAt!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
export class RecordFeePaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount!: number;
  @IsIn(['cash','bank_transfer','upi_reference','cheque','other']) method!: string;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
