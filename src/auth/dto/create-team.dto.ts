import { IsOptional, IsString, IsEmail, ValidateIf } from 'class-validator';

export class TeamDto {
  @IsString()
  name: string;

  @IsString()
  ageLevel: string;

  @IsString()
  division: string;

  @IsString()
  state: string;

  @IsString()
  city: string;

  @IsString()
  organizationId: string;

  @ValidateIf((o) => o.email !== '' && o.email !== null && o.email !== undefined)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
