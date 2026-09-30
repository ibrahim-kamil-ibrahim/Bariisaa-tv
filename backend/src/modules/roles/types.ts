export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionResponse {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}
