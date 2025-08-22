import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
export class SearchController {
    constructor(private searchService: SearchService) { }

    
    @AuditLog('READ', 'SEARCH')
    @Get()
    async search(
        @Query('q') query?: string,
        @Query('state') state?: string,
        @Query('age_level') ageLevel?: string,
        @Query('division') division?: string,
        @Query('sort') sort: 'name' | 'recent' = 'name',
        @Query('page', ParseIntPipe) page: number = 1,
        @Query('limit', ParseIntPipe) limit: number = 10
    ) {
        return this.searchService.search({
            query,
            state,
            ageLevel,
            division,
            sort,
            page,
            limit,
        });
    }
}
