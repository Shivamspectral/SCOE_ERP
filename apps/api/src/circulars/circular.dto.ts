import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCircularDto {
  @IsString() @MinLength(3) @MaxLength(160)
  title!: string;

  @IsString() @MinLength(3) @MaxLength(10000)
  content!: string;

  @IsOptional() @IsIn(['general','academic','operations','event','urgent'])
  category?: string;

  @IsOptional() @IsDateString()
  acknowledgeBy?: string;
}
