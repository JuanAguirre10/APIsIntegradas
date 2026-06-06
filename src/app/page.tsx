'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import type { Author } from '@/lib/types'

interface AuthorForm {
  name: string
  email: string
  bio: string
  nationality: string
  birthYear: string
}

const emptyForm: AuthorForm = {
  name: '',
  email: '',
  bio: '',
  nationality: '',
  birthYear: '',
}

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<AuthorForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadAuthors() {
    setLoading(true)
    try {
      const res = await fetch('/api/authors')
      const data = await res.json()
      setAuthors(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar los autores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuthors()
  }, [])

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
      name: form.name,
      email: form.email,
      bio: form.bio || null,
      nationality: form.nationality || null,
      birthYear: form.birthYear || null,
    }

    try {
      const res = await fetch(
        editingId ? `/api/authors/${editingId}` : '/api/authors',
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
      loadAuthors()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(author: Author) {
    setEditingId(author.id)
    setForm({
      name: author.name,
      email: author.email,
      bio: author.bio ?? '',
      nationality: author.nationality ?? '',
      birthYear: author.birthYear?.toString() ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este autor y todos sus libros?')) return
    const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
    if (res.ok) loadAuthors()
    else alert('No se pudo eliminar')
  }

  const totalBooks = authors.reduce(
    (sum, a) => sum + (a._count?.books ?? 0),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Panel de autores</h1>

        {/* Estadísticas generales */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Autores" value={authors.length} />
          <StatCard label="Libros" value={totalBooks} />
          <StatCard
            label="Promedio libros/autor"
            value={
              authors.length ? (totalBooks / authors.length).toFixed(1) : '0'
            }
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Formulario crear / editar */}
          <section className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? 'Editar autor' : 'Nuevo autor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field
                label="Nombre *"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />
              <Field
                label="Email *"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
              <Field
                label="Nacionalidad"
                value={form.nationality}
                onChange={(v) => setForm({ ...form, nationality: v })}
              />
              <Field
                label="Año de nacimiento"
                type="number"
                value={form.birthYear}
                onChange={(v) => setForm({ ...form, birthYear: v })}
              />
              <div>
                <label className="mb-1 block text-sm font-medium">Bio</label>
                <textarea
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
                  {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear autor'}
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

          {/* Lista de autores */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Autores ({authors.length})
            </h2>
            {loading ? (
              <p className="text-gray-500">Cargando…</p>
            ) : authors.length === 0 ? (
              <p className="text-gray-500">Aún no hay autores registrados.</p>
            ) : (
              <ul className="space-y-3">
                {authors.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{a.name}</p>
                        <p className="text-sm text-gray-500">{a.email}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {a.nationality || 'Nacionalidad N/D'}
                          {a.birthYear ? ` · ${a.birthYear}` : ''} ·{' '}
                          <span className="font-medium text-indigo-600">
                            {a._count?.books ?? 0} libro(s)
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/authors/${a.id}`}
                          className="rounded bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          Ver libros
                        </Link>
                        <button
                          onClick={() => handleEdit(a)}
                          className="rounded bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
