import Link from 'next/link'

export default function Nav() {
  return (
    <header className="bg-indigo-700 text-white shadow">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          📚 Biblioteca
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/" className="rounded px-3 py-1 hover:bg-indigo-600">
            Autores
          </Link>
          <Link href="/books" className="rounded px-3 py-1 hover:bg-indigo-600">
            Buscar libros
          </Link>
        </div>
      </nav>
    </header>
  )
}
