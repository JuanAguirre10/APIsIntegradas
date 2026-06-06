'use client'

import { useCallback, useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import type { Author, Book, Pagination } from '@/lib/types'

interface BookForm {
  title: string
  description: string
  isbn: string
  publishedYear: string
  genre: string
  pages: string
  authorId: string
}

const emptyForm: BookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
  authorId: '',
}

export default function BooksPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])

  // Filtros
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)

  // Resultados
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)

  // Formulario
  const [form, setForm] = useState<BookForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Cargar autores y géneros disponibles una vez
  async function loadMeta() {
    const [aRes, bRes] = await Promise.all([
      fetch('/api/authors'),
      fetch('/api/books'),
    ])
    const aData = await aRes.json()
    const bData = await bRes.json()
    setAuthors(Array.isArray(aData) ? aData : [])
    const uniqueGenres = [
      ...new Set(
        (Array.isArray(bData) ? bData : [])
          .map((b: Book) => b.genre)
          .filter((g: string | null): g is string => !!g)
      ),
    ].sort()
    setGenres(uniqueGenres)
  }

  useEffect(() => {
    loadMeta()
  }, [])

  // Búsqueda (con debounce sobre todos los filtros)
  const runSearch = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (genre) qs.set('genre', genre)
    if (authorId) qs.set('authorId', authorId)
    qs.set('sortBy', sortBy)
    qs.set('order', order)
    qs.set('page', String(page))
    qs.set('limit', '6')

    try {
      const res = await fetch(`/api/books/search?${qs.toString()}`)
      const data = await res.json()
      setBooks(data.data ?? [])
      setPagination(data.pagination ?? null)
    } catch {
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [search, genre, authorId, sortBy, order, page])

  useEffect(() => {
    const t = setTimeout(runSearch, 350)
    return () => clearTimeout(t)
  }, [runSearch])

  // Volver a la página 1 cuando cambian filtros (no la página)
  useEffect(() => {
    setPage(1)
  }, [search, genre, authorId, sortBy, order])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title,
      description: form.description || null,
      isbn: form.isbn || null,
      publishedYear: form.publishedYear || null,
      genre: form.genre || null,
      pages: form.pages || null,
      authorId: form.authorId,
    }

    try {
      const res = await fetch(
        editingId ? `/api/books/${editingId}` : '/api/books',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }
      resetForm()
      loadMeta()
      runSearch()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(book: Book) {
    setEditingId(book.id)
    setForm({
      title: book.title,
      description: book.description ?? '',
      isbn: book.isbn ?? '',
      publishedYear: book.publishedYear?.toString() ?? '',
      genre: book.genre ?? '',
      pages: book.pages?.toString() ?? '',
      authorId: book.authorId,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este libro?')) return
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    if (res.ok) {
      loadMeta()
      runSearch()
    } else alert('No se pudo eliminar')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Buscar libros</h1>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Formulario crear / editar libro */}
          <section className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? 'Editar libro' : 'Nuevo libro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field
                label="Título *"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                required
              />
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Autor *
                </label>
                <select
                  required
                  value={form.authorId}
                  onChange={(e) =>
                    setForm({ ...form, authorId: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— Selecciona un autor —</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Género"
                  value={form.genre}
                  onChange={(v) => setForm({ ...form, genre: v })}
                />
                <Field
                  label="Año"
                  type="number"
                  value={form.publishedYear}
                  onChange={(v) => setForm({ ...form, publishedYear: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Páginas"
                  type="number"
                  value={form.pages}
                  onChange={(v) => setForm({ ...form, pages: v })}
                />
                <Field
                  label="ISBN"
                  value={form.isbn}
                  onChange={(v) => setForm({ ...form, isbn: v })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {error && (
                <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Guardando…'
                    : editingId
                      ? 'Actualizar'
                      : 'Crear libro'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Buscador + resultados */}
          <section>
            {/* Controles de búsqueda */}
            <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <input
                type="text"
                placeholder="🔎 Buscar por título…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">Todos los géneros</option>
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">Todos los autores</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="createdAt">Fecha de creación</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año</option>
                </select>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>

            {/* Total + loading */}
            <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
              <span>
                {pagination
                  ? `${pagination.total} resultado(s)`
                  : '—'}
              </span>
              {loading && <span className="text-indigo-600">Buscando…</span>}
            </div>

            {/* Lista de libros */}
            {!loading && books.length === 0 ? (
              <p className="text-gray-500">No se encontraron libros.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {books.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-semibold">{b.title}</p>
                    <p className="text-sm text-gray-500">
                      {b.author?.name ?? 'Autor desconocido'}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {b.genre || 'Sin género'}
                      {b.publishedYear ? ` · ${b.publishedYear}` : ''}
                      {b.pages ? ` · ${b.pages} págs` : ''}
                    </p>
                    {b.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                        {b.description}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(b)}
                        className="rounded bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
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
