const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'naik' },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User:', user.email, '| Name:', user.name);
  console.log('Status:', user.status);
  console.log('Roles:', user.roles.map(r => r.role.name));

  const perms = user.roles.flatMap(r => r.role.permissions.map(p => p.permission.name));
  console.log('Total permissions:', perms.length);
  console.log('Has subscriptions:read?', perms.includes('subscriptions:read'));
  console.log('Has subscriptions:create?', perms.includes('subscriptions:create'));

  await prisma.$disconnect();
}

main();
