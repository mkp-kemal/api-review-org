import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Module({
    imports: [
        NestRedisModule.forRoot({
            type: 'single', // type of redis: single or cluster
            url: 'redis://localhost:6379',
        }),
    ],
    exports: [NestRedisModule],
})
export class RedisModule { }
