import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://postgres.xxiflnuhuhxbdoxtcpgc:mCkRFLa2Bis9JRRD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
      },
    },
  })

  try {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { email: true, createdAt: true, name: true, verified: true }
    })
    console.log(`Total users: ${users.length}`)
    users.forEach(u => console.log(`- ${u.email} (${u.name || 'No Name'}), Verified: ${u.verified}, Created: ${u.createdAt}`))
  } catch (error: any) {
    console.error('Check failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
