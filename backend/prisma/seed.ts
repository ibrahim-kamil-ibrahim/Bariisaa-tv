import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('naik123', 12);

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: { name: 'super_admin', description: 'Full system access' },
  });

  await prisma.role.upsert({
    where: { name: 'content_manager' },
    update: {},
    create: { name: 'content_manager', description: 'Manage books, categories, authors' },
  });

  await prisma.role.upsert({
    where: { name: 'support_agent' },
    update: {},
    create: { name: 'support_agent', description: 'View users, handle support' },
  });

  const resources = [
    'users', 'books', 'categories', 'authors', 'subscriptions', 'payments',
    'coupons', 'notifications', 'reports', 'roles', 'audit', 'settings',
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

  for (const perm of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
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

  // Screen themes — dynamic backgrounds & avatars (mobile consumes these)
  const screenThemes = [
    { screenKey: 'auth_login', label: 'Login Screen', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'auth_signup', label: 'Sign Up Screen', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'home', label: 'Home / Discovery', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'books', label: 'Books', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'book_detail', label: 'Book Detail', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'player', label: 'Audio Player', avatarLabel: 'Melody the music fox' },
    { screenKey: 'ebook_reader', label: 'E-Book Reader', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'storytelling', label: 'Storytelling', avatarLabel: 'Tale the storyteller' },
    { screenKey: 'music', label: 'Music', avatarLabel: 'Melody the music fox' },
    { screenKey: 'my_doctor', label: 'My Doctor', avatarLabel: 'Dr. Buna the friendly doctor' },
    { screenKey: 'my_captain', label: 'My Captain', avatarLabel: 'Captain Kofi' },
    { screenKey: 'habits', label: 'Habits', avatarLabel: 'Buddy the habit helper' },
    { screenKey: 'favorites', label: 'Favorites', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'history', label: 'History', avatarLabel: 'Bariisaa the friendly owl' },
    { screenKey: 'profile', label: 'Profile', avatarLabel: 'Bariisaa the friendly owl' },
  ];

  for (const theme of screenThemes) {
    await prisma.screenTheme.upsert({
      where: { screenKey: theme.screenKey },
      update: {},
      create: theme,
    });
  }
  console.log('Screen themes seeded.');

  // Signup fields — dynamic profile form (mobile signup step 3)
  const signupFields = [
    { key: 'full_name', label: 'Full Name', type: 'text', required: true, order: 0 },
    { key: 'age', label: 'Age', type: 'number', required: false, order: 1 },
    { key: 'gender', label: 'Gender', type: 'dropdown', options: ['Male', 'Female'], required: false, order: 2 },
    { key: 'city', label: 'City', type: 'text', required: false, order: 3 },
    { key: 'country', label: 'Country', type: 'text', required: false, order: 4 },
  ];

  for (const field of signupFields) {
    await prisma.signupField.upsert({
      where: { key: field.key },
      update: {},
      create: field,
    });
  }
  console.log('Signup fields seeded.');

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
