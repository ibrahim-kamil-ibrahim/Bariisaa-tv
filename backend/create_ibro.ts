import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

async function main() {
  const prisma = new PrismaClient()
  const passwordHash = await bcrypt.hash('123123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'ibro' },
    update: { passwordHash, name: 'Ibro' },
    create: { email: 'ibro', passwordHash, name: 'Ibro', emailVerified: true, status: 'ACTIVE' }
  })

  console.log('Created user:', JSON.stringify({ id: user.id, email: user.email, name: user.name }, null, 2))

  try {
    const role = await prisma.role.findUnique({ where: { name: 'super_admin' } })
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id }
      })
      console.log('Assigned super_admin role')
    }
  } catch (e) {
    console.log('No role assignment:', e.message)
  }

  await prisma.$disconnect()
}

main()
