import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const data = [
  {
    name: 'Gabriel García Márquez',
    email: 'gabo@example.com',
    nationality: 'Colombia',
    birthYear: 1927,
    bio: 'Premio Nobel de Literatura 1982. Máximo exponente del realismo mágico.',
    books: [
      { title: 'Cien años de soledad', isbn: '978-0307474728', publishedYear: 1967, genre: 'Novela', pages: 417 },
      { title: 'El amor en los tiempos del cólera', isbn: '978-0307389732', publishedYear: 1985, genre: 'Novela', pages: 348 },
      { title: 'Crónica de una muerte anunciada', isbn: '978-1400034956', publishedYear: 1981, genre: 'Novela', pages: 122 },
      { title: 'Relato de un náufrago', isbn: '978-0679722052', publishedYear: 1970, genre: 'Periodismo', pages: 110 },
      { title: 'La hojarasca', isbn: '978-0060751548', publishedYear: 1955, genre: 'Novela', pages: 144 },
    ],
  },
  {
    name: 'Mario Vargas Llosa',
    email: 'mvllosa@example.com',
    nationality: 'Perú',
    birthYear: 1936,
    bio: 'Premio Nobel de Literatura 2010. Figura central del boom latinoamericano.',
    books: [
      { title: 'La ciudad y los perros', isbn: '978-8420471830', publishedYear: 1963, genre: 'Novela', pages: 419 },
      { title: 'La fiesta del chivo', isbn: '978-8420471849', publishedYear: 2000, genre: 'Novela', pages: 518 },
      { title: 'Conversación en La Catedral', isbn: '978-8420471856', publishedYear: 1969, genre: 'Novela', pages: 601 },
      { title: 'Los cachorros', isbn: '978-8437604794', publishedYear: 1967, genre: 'Cuento', pages: 96 },
    ],
  },
  {
    name: 'Julio Cortázar',
    email: 'cortazar@example.com',
    nationality: 'Argentina',
    birthYear: 1914,
    bio: 'Maestro del cuento corto y la narrativa experimental.',
    books: [
      { title: 'Rayuela', isbn: '978-8437604572', publishedYear: 1963, genre: 'Novela', pages: 736 },
      { title: 'Bestiario', isbn: '978-9870404109', publishedYear: 1951, genre: 'Cuento', pages: 168 },
      { title: 'Final del juego', isbn: '978-8466331904', publishedYear: 1956, genre: 'Cuento', pages: 208 },
    ],
  },
  {
    name: 'Isabel Allende',
    email: 'iallende@example.com',
    nationality: 'Chile',
    birthYear: 1942,
    bio: 'Una de las escritoras de lengua española más leídas del mundo.',
    books: [
      { title: 'La casa de los espíritus', isbn: '978-8401242120', publishedYear: 1982, genre: 'Novela', pages: 488 },
      { title: 'De amor y de sombra', isbn: '978-8497592420', publishedYear: 1984, genre: 'Novela', pages: 304 },
      { title: 'Paula', isbn: '978-8401242137', publishedYear: 1994, genre: 'Memorias', pages: 368 },
    ],
  },
]

async function main() {
  for (const a of data) {
    const author = await prisma.author.upsert({
      where: { email: a.email },
      update: {
        name: a.name,
        nationality: a.nationality,
        birthYear: a.birthYear,
        bio: a.bio,
      },
      create: {
        name: a.name,
        email: a.email,
        nationality: a.nationality,
        birthYear: a.birthYear,
        bio: a.bio,
      },
    })

    for (const b of a.books) {
      await prisma.book.upsert({
        where: { isbn: b.isbn },
        update: { ...b, authorId: author.id },
        create: { ...b, authorId: author.id },
      })
    }
    console.log(`✔ ${a.name} — ${a.books.length} libros`)
  }

  const totalAuthors = await prisma.author.count()
  const totalBooks = await prisma.book.count()
  console.log(`\nTotal en BD → ${totalAuthors} autores, ${totalBooks} libros`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
