import { IsString } from 'class-validator';

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
  city: string;          // wajib
  @IsString()
  organizationId: string; // wajib
}
