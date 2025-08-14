import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    constructor(
        private readonly auditLogService: AuditLogService,
        private readonly reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const auditConfig = this.reflector.get('AUDIT_LOG_ACTION', context.getHandler());

        return next.handle().pipe(
            tap((response) => {
                if (auditConfig) {
                    const targetId = this.getTargetId(request, response);
                    const actorUserId = request.user?.userId || 'ANONYMOUS';

                    this.auditLogService.log(actorUserId, {
                        action: auditConfig.action,
                        targetType: auditConfig.targetType ||
                            context.getClass().name.replace('Controller', ''),
                        targetId,
                        metadata: this.prepareMetadata(request, response)
                    }).catch(err => {
                        console.error('Audit log failed:', err);
                    });
                }
            })
        );
    }

    private getTargetId(request: any, response: any): string {
        return request.params?.id ||
            response?.id ||
            (Array.isArray(response) ? 'multiple' : 'none');
    }

    private prepareMetadata(request: any, response: any) {
        return {
            path: request.path,
            method: request.method,
            params: request.params,
            query: request.query,
            responseSummary: this.summarizeResponse(response)
        };
    }

    private summarizeResponse(response: any) {
        if (Array.isArray(response)) {
            return { count: response.length };
        }
        if (typeof response === 'object' && response !== null) {
            const { id, createdAt, updatedAt, ...summary } = response;
            return summary;
        }
        return { type: typeof response };
    }
}