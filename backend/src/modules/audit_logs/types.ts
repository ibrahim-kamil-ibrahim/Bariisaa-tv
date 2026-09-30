export interface AuditLogResponse {
  id: string;
  userId: string | null;
  user: { id: string; name: string | null; email: string | null } | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: unknown;
  ip: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
