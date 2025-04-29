import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const prismaClient = new PrismaClient()

void (async () => {
  await prismaClient.user.create({
    data: {
      name: 'BiblioAdmin',
      email: 'admin@gmail.com',
      password: await bcryptjs.hash('admin', 12),
    }
  })
  console.log('Admin user created')
})()