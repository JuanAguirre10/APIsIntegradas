'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import type { Author, AuthorStats, Book } from '@/lib/types'

export default function AuthorDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Editar autor
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    nationality: '',
    birthYear: '',
    bio: '',
  })

  // Nuevo libro
  const [bookForm, setBookForm] = useState({
    title: '',
    genre: '',
    publishedYear: '',
    pages: '',
    isbn: '',
  })
  const [bookError, setBookError] = useState('')

  async function loadAll() {
    setLoading(true)
    try {
      const [aRes, sRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ])
      if (aRes.status === 404) {
        setNotFound(true)
        return
      }
      const aData: Author = await aRes.json()
      const sData: AuthorStats = await sRes.json()
      setAuthor(aData)
      setStats(sData)
      setEditForm({
        name: aData.name,
        email: aData.email,
        nationality: aData.nationality ?? '',
        birthYear: aData.birthYear?.toString() ?? '',
        bio: aData.bio ?? '',
      })
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function saveAuthor(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/authors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        email: editForm.email,
        nationality: editForm.nationality || null,
        birthYear: editForm.birthYear || null,
        bio: editForm.bio || null,
      }),
    })
    if (res.ok) {
      setEditing(false)
      loadAll()
    } else {
      const d = await res.json()
      alert(d.error || 'No se pudo actualizar')
    }
  }

  async function addBook(e: React.FormEvent) {
    e.preventDefault()
    setBookError('')
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: bookForm.title,
        genre: bookForm.genre || null,
        publishedYear: bookForm.publishedYear || null,
        pages: bookForm.pages || null,
        isbn: bookForm.isbn || null,
        authorId: id,
      }),
    })
    const d = await res.json()
    if (!res.ok) {
      setBookError(d.error || 'Error al crear libro')
      return
    }
    setBookForm({ title: '', genre: '', publishedYear: '', pages: '', isbn: '' })
    loadAll()
  }

  async function deleteBook(bookId: string) {
    if (!confirm('¿Eliminar este libro?')) return
    const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
    if (res.ok) loadAll()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <p className="mx-auto max-w-6xl px-4 py-8 text-gray-500">Cargando…</p>
      </div>
    )
  }

  if (notFound || !author) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-gray-600">Autor no encontrado.</p>
          <Link href="/" className="text-indigo-600 underline">
            ← Volver
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Volver a autores
        </Link>

        {/* Cabecera del autor */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{author.name}</h1>
              <p className="text-gray-500">{author.email}</p>
              <p className="mt-1 text-sm text-gray-600">
                {author.nationality || 'Nacionalidad N/D'}
                {author.birthYear ? ` · Nació en ${author.birthYear}` : ''}
              </p>
              {author.bio && (
                <p className="mt-3 max-w-2xl text-sm text-gray-700">
                  {author.bio}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              {editing ? 'Cerrar' : 'Editar autor'}
            </button>
          </div>

          {editing && (
            <form
              onSubmit={saveAuthor}
              className="mt-5 grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2"
            >
              <Field
                label="Nombre"
                value={editForm.name}
                onChange={(v) => setEditForm({ ...editForm, name: v })}
              />
              <Field
                label="Email"
                value={editForm.email}
                onChange={(v) => setEditForm({ ...editForm, email: v })}
              />
              <Field
                label="Nacionalidad"
                value={editForm.nationality}
                onChange={(v) => setEditForm({ ...editForm, nationality: v })}
              />
              <Field
                label="Año de nacimiento"
                type="number"
                value={editForm.birthYear}
                onChange={(v) => setEditForm({ ...editForm, birthYear: v })}
              />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Bio</label>
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:col-span-2"
              >
                Guardar cambios
              </button>
            </form>
          )}
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total libros" value={stats.totalBooks} />
              <StatCard
                label="Promedio páginas"
                value={stats.averagePages}
              />
              <StatCard
                label="Primer libro"
                value={stats.firstBook?.year ?? '—'}
              />
              <StatCard
                label="Último libro"
                value={stats.latestBook?.year ?? '—'}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoBox title="Géneros">
                {stats.genres.length ? (
                  <div className="flex flex-wrap gap-2">
                    {stats.genres.map((g) => (
                      <span
                        key={g}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin géneros</p>
                )}
              </InfoBox>
              <InfoBox title="Extremos por páginas">
                <p className="text-sm text-gray-700">
                  📖 Más largo:{' '}
                  {stats.longestBook
                    ? `${stats.longestBook.title} (${stats.longestBook.pages} págs)`
                    : '—'}
                </p>
                <p className="text-sm text-gray-700">
                  📄 Más corto:{' '}
                  {stats.shortestBook
                    ? `${stats.shortestBook.title} (${stats.shortestBook.pages} págs)`
                    : '—'}
                </p>
              </InfoBox>
            </div>
          </div>
        )}

        {/* Agregar libro */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Agregar libro a este autor</h2>
          <form onSubmit={addBook} className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Título *"
              value={bookForm.title}
              onChange={(v) => setBookForm({ ...bookForm, title: v })}
              required
            />
            <Field
              label="Género"
              value={bookForm.genre}
              onChange={(v) => setBookForm({ ...bookForm, genre: v })}
            />
            <Field
              label="Año"
              type="number"
              value={bookForm.publishedYear}
              onChange={(v) =>
                setBookForm({ ...bookForm, publishedYear: v })
              }
            />
            <Field
              label="Páginas"
              type="number"
              value={bookForm.pages}
              onChange={(v) => setBookForm({ ...bookForm, pages: v })}
            />
            <Field
              label="ISBN"
              value={bookForm.isbn}
              onChange={(v) => setBookForm({ ...bookForm, isbn: v })}
            />
            {bookError && (
              <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
                {bookError}
              </p>
            )}
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:col-span-2"
            >
              Agregar libro
            </button>
          </form>
        </div>

        {/* Lista de libros */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">
            Libros ({author.books?.length ?? 0})
          </h2>
          {!author.books || author.books.length === 0 ? (
            <p className="text-gray-500">Este autor aún no tiene libros.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {author.books.map((b: Book) => (
                <li
                  key={b.id}
                  className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold">{b.title}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {b.genre || 'Sin género'}
                    {b.publishedYear ? ` · ${b.publishedYear}` : ''}
                    {b.pages ? ` · ${b.pages} págs` : ''}
                  </p>
                  <button
                    onClick={() => deleteBook(b.id)}
                    className="mt-3 w-fit rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

function InfoBox({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-gray-700">{title}</p>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </div>
  )
}
