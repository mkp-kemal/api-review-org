import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Module({
    imports: [
        NestRedisModule.forRoot({
            type: 'single', // type of redis: single or cluster
            url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        }),
    ],
    exports: [NestRedisModule],
})
export class RedisModule { }
