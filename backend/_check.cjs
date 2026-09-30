const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findUnique({ where: { email: 'naik' }, select: { id: true, email: true, name: true, status: true } })
  .then(u => { console.log(JSON.stringify(u, null, 2)); p.$disconnect(); })
  .catch(e => { console.error(e.message); p.$disconnect(); });
