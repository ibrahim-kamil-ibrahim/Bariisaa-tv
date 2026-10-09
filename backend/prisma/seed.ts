import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // In production the super-admin password MUST be provided via environment.
  const production = process.env.NODE_ENV === 'production';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (production ? null : 'naik123');
  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable is required when NODE_ENV=production');
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: { name: 'super_admin', description: 'Full system access (bypasses all permission checks)' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Full administrative access without super-admin bypass' },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: { name: 'editor', description: 'Create and manage content (books, stories, music, media)' },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: { name: 'moderator', description: 'Review reports, moderate content, view users and audit logs' },
  });

  const resources = [
    'users', 'books', 'categories', 'authors', 'subscriptions', 'payments',
    'coupons', 'notifications', 'reports', 'roles', 'audit', 'settings',
    'media', 'storytelling', 'music', 'doctor', 'captain', 'habits', 'cms', 'filters',
  ];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissionRecords: { id: string; name: string; resource: string; action: string }[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { name: `${resource}:${action}` },
        update: {},
        create: { name: `${resource}:${action}`, resource, action },
      });
      permissionRecords.push(perm);
    }
  }

  const grant = async (roleId: string, permissionId: string) => {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  };

  for (const perm of permissionRecords) {
    await grant(superAdminRole.id, perm.id);
    await grant(adminRole.id, perm.id);
  }

  const editorResources = ['books', 'categories', 'authors', 'storytelling', 'music', 'doctor', 'captain', 'habits', 'cms', 'media', 'filters'];
  for (const perm of permissionRecords) {
    if (editorResources.includes(perm.resource)) await grant(editorRole.id, perm.id);
  }

  const moderatorResources: { resource: string; actions: string[] }[] = [
    { resource: 'users', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'audit', actions: ['read'] },
    { resource: 'notifications', actions: ['create', 'update'] },
    { resource: 'storytelling', actions: ['read', 'update'] },
    { resource: 'music', actions: ['read', 'update'] },
    { resource: 'cms', actions: ['read', 'update'] },
  ];
  for (const spec of moderatorResources) {
    for (const action of spec.actions) {
      const perm = permissionRecords.find((p) => p.resource === spec.resource && p.action === action);
      if (perm) await grant(moderatorRole.id, perm.id);
    }
  }

  // Clean up old admin user if exists
  await prisma.userRole.deleteMany({ where: { user: { email: 'admin@naik.com' } } });
  await prisma.refreshToken.deleteMany({ where: { user: { email: 'admin@naik.com' } } });
  await prisma.user.delete({ where: { email: 'admin@naik.com' } }).catch(() => {});

  const testUser = await prisma.user.upsert({
    where: { email: 'naik' },
    update: { name: 'Super Admin' },
    create: {
      email: 'naik',
      passwordHash,
      name: 'Super Admin',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: testUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: testUser.id, roleId: superAdminRole.id },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-basic' },
    update: {},
    create: {
      id: 'plan-basic',
      name: 'Basic',
      durationMonths: 1,
      price: 50,
      currency: 'ETB',
      features: { unlimitedAccess: true, offlineDownloads: false, maxDevices: 2, adFree: false },
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Pro',
      durationMonths: 1,
      price: 100,
      currency: 'ETB',
      features: { unlimitedAccess: true, offlineDownloads: true, maxDevices: 5, adFree: true },
      isActive: true,
    },
  });

  const defaultSettings: { key: string; value: string; type: string; group: string; label: string }[] = [
    { key: 'app_name', value: 'Bariisaa Tv', type: 'string', group: 'general', label: 'Application Name' },
    { key: 'support_email', value: 'support@bariisaatv.com', type: 'string', group: 'general', label: 'Support Email' },
    { key: 'max_upload_size_mb', value: '500', type: 'number', group: 'content', label: 'Max Upload Size (MB)' },
    { key: 'default_page_size', value: '20', type: 'number', group: 'content', label: 'Default Page Size' },
    { key: 'require_email_verification', value: 'true', type: 'boolean', group: 'security', label: 'Require Email Verification' },
    { key: 'enable_audit_logging', value: 'true', type: 'boolean', group: 'security', label: 'Enable Audit Logging' },
    { key: 'session_timeout_minutes', value: '60', type: 'number', group: 'security', label: 'Session Timeout (Minutes)' },
    { key: 'currency', value: 'USD', type: 'string', group: 'billing', label: 'Default Currency' },
    { key: 'trial_duration_days', value: '7', type: 'number', group: 'billing', label: 'Free Trial Days' },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Screen themes & signup fields: the corresponding Prisma models were removed
  // from the schema (no API serves them), so seeding is skipped. The tables
  // created by historical migrations are left untouched.

  console.log('Infrastructure seed created successfully.');

  const mobileClient = await prisma.oAuthClient.upsert({
    where: { clientId: 'bariisaa-mobile' },
    update: {},
    create: {
      clientId: 'bariisaa-mobile',
      name: 'Bariisaa Mobile App',
      redirectUris: ['com.bariisaa.app://callback'],
      allowedScopes: ['openid', 'profile', 'email'],
      isConfidential: false,
      isActive: true,
    },
  });
  console.log(`OAuth client seeded: ${mobileClient.clientId}`);

  // Seed explore categories for the home screen
  const exploreCategories = [
    { name: 'Books', slug: 'explore-books', description: 'Audiobooks & e-books', iconEmoji: '📖', route: '/books', sortOrder: 0 },
    { name: 'Storytelling', slug: 'explore-storytelling', description: 'Interactive stories', iconEmoji: '📖', route: '/storytelling', sortOrder: 1 },
    { name: 'Music', slug: 'explore-music', description: 'Songs & rhymes', iconEmoji: '🎵', route: '/music', sortOrder: 2 },
    { name: 'My Doctor', slug: 'explore-my-doctor', description: 'Health adventures', iconEmoji: '🏥', route: '/my-doctor', sortOrder: 3 },
    { name: 'My Captain', slug: 'explore-my-captain', description: 'Challenges & rewards', iconEmoji: '🏆', route: '/my-captain', sortOrder: 4 },
    { name: 'Habits', slug: 'explore-habits', description: 'Daily routines', iconEmoji: '✅', route: '/habits', sortOrder: 5 },
  ];

  for (const cat of exploreCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Explore categories seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
