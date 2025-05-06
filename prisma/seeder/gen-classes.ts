import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient()

void (async () => {
  const classes = [
    { name: '1º Adm A', year: 2025 },
    { name: '1º Adm B', year: 2025 },
    { name: '1º Redes A', year: 2025 },
    { name: '1º Redes B', year: 2025 },
    { name: '2º Adm A', year: 2025 },
    { name: '2º Adm B', year: 2025 },
    { name: '2º Redes A', year: 2025 },
    { name: '2º Redes B', year: 2025 },
    { name: '3º Adm A', year: 2025 },
    { name: '3º Adm B', year: 2025 },
    { name: '3º Redes A', year: 2025 },
    { name: '3º Redes B', year: 2025 },
  ]

  await prismaClient.class.createMany({
    data: classes.map((classData) => ({
      name: classData.name,
      year: classData.year.toString(),
    })),
  })
  console.log('classes created')
})()