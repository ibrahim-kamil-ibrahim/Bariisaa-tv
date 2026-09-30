import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function getPermissionMatrix() {
  const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
  const permissions = await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });

  const resources = [...new Set(permissions.map(p => p.resource))];
  const actions = [...new Set(permissions.map(p => p.action))];

  const matrix = roles.map(role => {
    const rolePermIds = new Set(role.permissions.map(rp => rp.permissionId));
    return {
      roleId: role.id,
      roleName: role.name,
      permissions: permissions.map(p => ({
        permissionId: p.id,
        resource: p.resource,
        action: p.action,
        granted: rolePermIds.has(p.id),
      })),
    };
  });

  return { matrix, resources, actions, allPermissions: permissions };
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new AppError('Role not found', 404);

  await prisma.rolePermission.deleteMany({ where: { roleId } });
  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({ roleId, permissionId })),
    });
  }

  return prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
}

export async function getResources() {
  const permissions = await prisma.permission.findMany({ select: { resource: true, action: true }, distinct: ['resource'] });
  return permissions.map(p => p.resource);
}
