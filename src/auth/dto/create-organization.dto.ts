import { IsString } from 'class-validator';

export class OrganizationDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  website: string;

  @IsString()
  claimedById?: string;
}
