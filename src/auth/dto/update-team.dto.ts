import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, ValidateIf, IsEnum } from 'class-validator';
import { TeamDto } from './create-team.dto';
import { OrgStatus } from '@prisma/client';

export class UpdateTeamDto extends PartialType(TeamDto) {
  @ApiProperty({ example: 'APPROVED', description: 'Status organisasi' })
    @IsOptional()
    @IsEnum(OrgStatus)
    status: OrgStatus;
}
