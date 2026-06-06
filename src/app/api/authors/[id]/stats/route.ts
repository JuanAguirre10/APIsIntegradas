import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Estadísticas completas de un autor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const books = author.books
    const totalBooks = books.length

    // Libros con año de publicación, ordenados ascendente
    const byYear = books
      .filter((b) => b.publishedYear != null)
      .sort((a, b) => a.publishedYear! - b.publishedYear!)

    const firstBook = byYear.length
      ? { title: byYear[0].title, year: byYear[0].publishedYear }
      : null
    const latestBook = byYear.length
      ? {
          title: byYear[byYear.length - 1].title,
          year: byYear[byYear.length - 1].publishedYear,
        }
      : null

    // Promedio de páginas (solo libros que tienen páginas)
    const withPages = books.filter((b) => b.pages != null)
    const averagePages = withPages.length
      ? Math.round(
          withPages.reduce((sum, b) => sum + b.pages!, 0) / withPages.length
        )
      : 0

    // Géneros únicos
    const genres = [
      ...new Set(books.map((b) => b.genre).filter((g): g is string => !!g)),
    ]

    // Libro más largo y más corto (por páginas)
    const byPages = [...withPages].sort((a, b) => b.pages! - a.pages!)
    const longestBook = byPages.length
      ? { title: byPages[0].title, pages: byPages[0].pages }
      : null
    const shortestBook = byPages.length
      ? {
          title: byPages[byPages.length - 1].title,
          pages: byPages[byPages.length - 1].pages,
        }
      : null

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook,
      latestBook,
      averagePages,
      genres,
      longestBook,
      shortestBook,
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
