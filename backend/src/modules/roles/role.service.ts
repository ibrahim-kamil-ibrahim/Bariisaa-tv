import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { Role, Permission } from '@prisma/client';

export interface RoleInput {
  name: string;
  description?: string;
  permissions?: Record<string, string[]>;
  permissionIds?: string[];
}

function toPermissionName(resource: string, action: string) {
  return `${resource}:${action}`;
}

function parsePermissionName(name: string) {
  const [resource, action] = name.split(':');
  return { resource, action };
}

function groupPermissions(permissions: Permission[]) {
  const grouped: Record<string, string[]> = {};

  for (const perm of permissions) {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    if (!grouped[perm.resource].includes(perm.action)) {
      grouped[perm.resource].push(perm.action);
    }
  }

  return grouped;
}

async function resolvePermissionIds(input: RoleInput) {
  const ids = new Set<string>();

  if (input.permissionIds && input.permissionIds.length > 0) {
    for (const id of input.permissionIds) {
      ids.add(id);
    }
  }

  if (input.permissions) {
    const requiredNames: string[] = [];
    for (const [resource, actions] of Object.entries(input.permissions)) {
      for (const action of actions) {
        requiredNames.push(toPermissionName(resource, action));
      }
    }

    if (requiredNames.length > 0) {
      const found = await prisma.permission.findMany({
        where: { name: { in: requiredNames } },
      });

      for (const perm of found) {
        ids.add(perm.id);
      }
    }
  }

  return Array.from(ids);
}

export async function listRoles() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: groupPermissions(role.permissions.map((rp) => rp.permission)),
    userCount: role._count.users,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }));
}

export async function getRoleById(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: groupPermissions(role.permissions.map((rp) => rp.permission)),
    userCount: role._count.users,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export async function getAllPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });

  return permissions.map((p) => ({
    id: p.id,
    name: p.name,
    resource: p.resource,
    action: p.action,
    description: p.description,
  }));
}

export async function createRole(data: RoleInput) {
  const existing = await prisma.role.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new AppError('Role name already exists', 409);
  }

  const permissionIds = await resolvePermissionIds(data);

  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        create: permissionIds.map((permissionId) => ({ permissionId })),
      },
    },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: groupPermissions(role.permissions.map((rp) => rp.permission)),
    userCount: role._count.users,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export async function updateRole(id: string, data: RoleInput) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true },
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  if (data.name && data.name !== role.name) {
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new AppError('Role name already exists', 409);
    }
  }

  const permissionIds = await resolvePermissionIds(data);

  const updated = await prisma.role.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        deleteMany: {},
        create: permissionIds.map((permissionId) => ({ permissionId })),
      },
    },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    permissions: groupPermissions(updated.permissions.map((rp) => rp.permission)),
    userCount: updated._count.users,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { users: true },
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  if (role.users.length > 0) {
    throw new AppError('Cannot delete role assigned to users', 409);
  }

  await prisma.role.delete({ where: { id } });
  return { message: 'Role deleted successfully' };
}
