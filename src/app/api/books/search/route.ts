import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET - Búsqueda de libros con filtros, ordenamiento y paginación
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.trim() || ''
    const genre = searchParams.get('genre')?.trim() || ''
    const authorName = searchParams.get('authorName')?.trim() || ''
    const authorId = searchParams.get('authorId')?.trim() || ''

    // Paginación
    let page = parseInt(searchParams.get('page') || '1')
    if (isNaN(page) || page < 1) page = 1

    let limit = parseInt(searchParams.get('limit') || '10')
    if (isNaN(limit) || limit < 1) limit = 10
    if (limit > 50) limit = 50 // máximo permitido

    // Ordenamiento (con valores permitidos)
    const allowedSortBy = ['title', 'publishedYear', 'createdAt']
    const sortByParam = searchParams.get('sortBy') || 'createdAt'
    const sortBy = allowedSortBy.includes(sortByParam) ? sortByParam : 'createdAt'

    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    // Construir filtros dinámicos
    const where: Prisma.BookWhereInput = {}
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }
    if (genre) {
      where.genre = genre
    }
    if (authorId) {
      where.authorId = authorId
    }
    if (authorName) {
      where.author = { name: { contains: authorName, mode: 'insensitive' } }
    }

    // Total de resultados (para la paginación)
    const total = await prisma.book.count({ where })
    const totalPages = Math.ceil(total / limit)

    const data = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
