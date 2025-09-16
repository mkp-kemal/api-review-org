import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post,
  Req,
  UploadedFile, UploadedFiles, UseFilters, UseGuards, UseInterceptors
} from "@nestjs/common";
import { TeamService } from "./team.service";
import { JwtAuthGuard } from "src/auth/strategies/jwt-auth.guard";
import { RoleGuard } from "src/auth/strategies/role-guard";
import { Role, TypeSystemUpload } from "@prisma/client";
import { AuditLog } from "src/audit/audit-log.decorator";
import { TeamDto } from "src/auth/dto/create-team.dto";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import * as csvParser from 'csv-parser';
import { File as MulterFile } from 'multer';
import * as multer from 'multer';
import * as streamifier from 'streamifier';
import { ApiTags, ApiResponse, ApiConsumes, ApiBody, ApiParam } from "@nestjs/swagger";
import { UpdateTeamDto } from "src/auth/dto/update-team.dto";
import { UploadFileDto } from "src/auth/dto/upload-file.dto";
import { MulterExceptionFilter } from "src/common/multer-exception.filter";
import { TryoutsDto } from "src/auth/dto/tryouts.dto";


@ApiTags('Teams')
@Controller('teams')
@UseFilters(MulterExceptionFilter)
export class TeamController {
  constructor(
    private teamService: TeamService
  ) { }

  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @ApiResponse({ status: 200, description: 'List of all teams with subscription & organization info' })
  @Get()
  getTeams() {
    return this.teamService.findAll();
  }

  @ApiResponse({ status: 200, description: 'Details of a specific team including reviews & ratings' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @Get(':id')
  getTeamById(@Param('id') id: string) {
    return this.teamService.findById(id);
  }

  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiBody({ type: TeamDto })
  @AuditLog('CREATE', 'TEAM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN]))
  @Post()
  createTeam(@Body() teamDto: TeamDto, @Req() req) {
    return this.teamService.create(teamDto, req.user.userId);
  }

  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  @ApiBody({ type: UpdateTeamDto })
  @AuditLog('UPDATE', 'TEAM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @Patch(':id')
  updateTeam(@Param('id') id: string, @Body() teamDto: UpdateTeamDto, @Req() req) {
    return this.teamService.update(id, teamDto, req.user.userId);
  }

  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete team with related reviews' })
  @AuditLog('DELETE', 'TEAM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Delete(':id')
  deleteTeam(@Param('id') id: string) {
    return this.teamService.delete(id);
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', example: 'org_123' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV uploaded and processed successfully' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog('CREATE', 'TEAM_CSV')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN]))
  @Post('upload-csv')
  async uploadCsv(
    @UploadedFile() file: MulterFile,
    @Body('organizationId') organizationId: string,
  ) {
    const results: any[] = [];

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return new Promise((resolve, reject) => {
      streamifier.createReadStream(file.buffer)
        .pipe(csvParser())
        .on('data', (row: any) => results.push(row))
        .on('end', async () => {
          try {
            const created = await this.teamService.csvCreateMany(results, organizationId);
            resolve({ message: 'CSV processed successfully', data: created });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => reject(err));
    });
  }

  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Get('access/claim')
  async getTeamsWithAccess(@Req() req) {
    return this.teamService.getTeamsWithAccess(req.user.userId, req.user.role);
  }

  @ApiResponse({ status: 200, description: 'Team successfully claimed' })
  @AuditLog('UPDATE', 'TEAM_CLAIM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Patch('claim/:teamId')
  async claimTeamByEmail(@Body('email') email: string, @Param('teamId') teamId: string, @Req() req) {
    return this.teamService.claimTeamByEmail(req.user.userId, email, teamId);
  }

  @ApiBody({
    schema: {
      properties: {
        teamId: {
          type: 'string',
          example: 'team_123',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['teamId', 'files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      // limits: { fileSize: 1 * 1024 * 1024 },
    }),
  )
  @AuditLog('CREATE', 'TEAM_PHOTOS')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Post('upload-photos')
  async upload(@UploadedFiles() files: MulterFile[], @Body() dto: UploadFileDto) {
    const photoPaths = await this.teamService.uploadTeamPhotos(dto.teamId, files);
    return {
      message: 'Files uploaded successfully',
      photos: photoPaths,
    };
  }

  @ApiBody({
    schema: {
      properties: {
        teamId: {
          type: 'string',
          example: 'team_123',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['teamId', 'files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      // limits: { fileSize: 1 * 1024 * 1024 },
    }),
  )
  @AuditLog('CREATE', 'TEAM_PHOTOS_AWS')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Post('upload-photos-aws')
  async uploadAws(@UploadedFiles() files: MulterFile[], @Body() dto: UploadFileDto) {
    const photoPaths = await this.teamService.uploadTeamPhotosAws(dto.teamId, files);
    return {
      message: 'Files uploaded successfully',
      photos: photoPaths,
    };
  }

  @AuditLog('DELETE', 'TEAM_PHOTOS_AWS')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Delete('upload-photos-aws/:photoId')
  async deleteTeamPhotosAws(@Param('photoId') photoId: string) {
    return this.teamService.deleteTeamPhotosAws(photoId);
  }

  @AuditLog('DELETE', 'TEAM_PHOTOS_AWS_RESET')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Delete('reset-photos-aws/:teamId')
  async resetTeamPhotosAws(@Param('teamId') teamId: string) {
    return this.teamService.resetTeamPhotosAws(teamId);
  }

  @ApiParam({
    name: 'typeSystemUpload',
    enum: TypeSystemUpload,
    required: true,
    description: 'Type of system upload',
  })
  @ApiBody({
    schema: {
      properties: {
        teamId: {
          type: 'string',
          example: 'team_123',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['teamId', 'files'],
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      // limits: { fileSize: 1 * 1024 * 1024 },
    })
  )
  @AuditLog('CREATE', 'TEAM_PHOTOS_AWS_OR_LOCAL')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Post('upload-photos-by/:typeSystemUpload')
  async uploadTeamPhotosAwsOrLocal(@UploadedFiles() files: MulterFile[], @Body() dto: UploadFileDto, @Param('typeSystemUpload') typeSystem: TypeSystemUpload) {
    return this.teamService.uploadTeamPhotosAwsOrLocal(dto.teamId, files, typeSystem);
  }

  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @Get('files/all')
  async getAllFilesOnTeam(@Req() req) {
    return this.teamService.getAllFilesOnTeam(req.user.userId);
  }

  @AuditLog('CREATE', 'TEAM_TRYOUTS')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @Post('tryouts/:id')
  async createTryOuts(@Param('id') id: string, @Body() dto: TryoutsDto) {
    return this.teamService.createTryOuts(id, dto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @Delete('tryouts/:id')
  @AuditLog('DELETE', 'TEAM_TRYOUTS')
  async deleteTryout(@Param('id') id: string) {
    return this.teamService.deleteTryout(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @Get('tryouts/claimed')
  async getTryoutsByClaimedUser(@Req() req) {
    return this.teamService.getTryoutsByClaimedUser(req.user.userId, false);
  }

  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Get('tryouts/all')
  async getTryouts(@Req() req, @Param('userId') userId: string) {
    return this.teamService.getTryoutsByClaimedUser(userId, true);
  }

  @ApiBody({
    schema: {
      properties: {
        teamId: {
          type: 'string',
          example: 'team_123',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['teamId', 'files'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      // limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @AuditLog('CREATE', 'TEAM_LOGO')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
  @Post('upload-logo')
  async uploadLogoAws(
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadFileDto,
  ) {
    const photoPath = await this.teamService.uploadLogoTeam(dto.teamId, file);
    return {
      message: 'File uploaded successfully',
      photo: photoPath,
    };
  }

}
