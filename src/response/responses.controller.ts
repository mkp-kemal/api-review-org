import {
    Controller,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Request
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CreateResponseDto } from 'src/auth/dto/create-response.dto';
import { UpdateResponseDto } from 'src/auth/dto/update-response.dto';
import { AuditLog } from 'src/audit/audit-log.decorator';

@ApiTags('Organization Responses')
@ApiBearerAuth()
@Controller()
export class ResponsesController {
    constructor(private readonly responsesService: ResponsesService) { }

    @AuditLog('CREATE', 'RESPONSE')
    @UseGuards(JwtAuthGuard)
    @Post('reviews/:id/response')
    async createResponse(
        @Param('id') reviewId: string,
        @Body() dto: CreateResponseDto,
        @Request() req
    ) {
        return this.responsesService.createResponse(reviewId, req.user.userId, dto);
    }

    @AuditLog('UPDATE', 'RESPONSE')
    @UseGuards(JwtAuthGuard)
    @Patch('responses/:id')
    async updateResponse(
        @Param('id') id: string,
        @Body() dto: UpdateResponseDto,
        @Request() req
    ) {
        return this.responsesService.updateResponse(id, req.user.userId, dto);
    }

    @AuditLog('READ', 'RESPONSE_DETAIL')
    @UseGuards(JwtAuthGuard)
    @Delete('responses/:id')
    async deleteResponse(
        @Param('id') id: string,
        @Request() req
    ) {
        return this.responsesService.deleteResponse(id, req.user.userId);
    }
}