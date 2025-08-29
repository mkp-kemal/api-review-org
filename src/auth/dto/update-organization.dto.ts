import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { OrgStatus } from '@prisma/client';
import { OrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(OrganizationDto) {
  @ApiProperty({ example: 'APPROVED', description: 'Status organisasi' })
  @IsOptional()
  @IsEnum(OrgStatus)
  status: OrgStatus;
}
