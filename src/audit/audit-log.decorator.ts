import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_ACTION = 'AUDIT_LOG_ACTION';
export const AUDIT_LOG_TARGET_TYPE = 'AUDIT_LOG_TARGET_TYPE';

export const AuditLog = (action: string, targetType?: string) => 
  SetMetadata(AUDIT_LOG_ACTION, { action, targetType });