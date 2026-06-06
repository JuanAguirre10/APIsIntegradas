# 📚 Sistema de Biblioteca — API Routes con Next.js, Prisma y Supabase

Aplicación web para gestionar una biblioteca de **autores** y **libros**, construida con **Next.js 16 (App Router)**, **Prisma ORM 7** y **PostgreSQL (Supabase)**. Incluye una API REST completa (CRUD + búsqueda avanzada + estadísticas) y un frontend que la consume.

> Laboratorio — Desarrollo de Aplicaciones Web Avanzado (TECSUP).

---

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS v4 |
| ORM | Prisma 7 + `@prisma/adapter-pg` (driver adapter) |
| Base de datos | PostgreSQL en Supabase |
| Lenguaje | TypeScript |

---

## 🚀 Puesta en marcha

### 1. Requisitos
- Node.js **20.9+**
- Una base de datos PostgreSQL (este proyecto usa **Supabase**)

### 2. Instalar dependencias
```bash
npm install
```
> El script `postinstall` ejecuta `prisma generate` automáticamente.

### 3. Variables de entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://USUARIO:PASSWORD@HOST:5432/postgres"
```

### 4. Sincronizar el esquema con la base de datos
```bash
npx prisma db push
```

### 5. Levantar el servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000).

---

## 🗂️ Modelos (Prisma)

```prisma
model Author {
  id, name, email (único), bio?, nationality?, birthYear?
  books   Book[]
}

model Book {
  id, title, description?, isbn? (único), publishedYear?, genre?, pages?
  authorId -> Author (onDelete: Cascade)
}
```

---

## 🔌 API Routes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` / `POST` | `/api/authors` | Listar / crear autores |
| `GET` / `PUT` / `DELETE` | `/api/authors/[id]` | Obtener / actualizar / eliminar autor |
| `GET` | `/api/authors/[id]/books` | Libros de un autor |
| `GET` | `/api/authors/[id]/stats` | Estadísticas del autor |
| `GET` / `POST` | `/api/books` | Listar (con filtros) / crear libros |
| `GET` / `PUT` / `DELETE` | `/api/books/[id]` | Obtener / actualizar / eliminar libro |
| `GET` | `/api/books/search` | Búsqueda avanzada con paginación |

### Búsqueda avanzada — `/api/books/search`
Query params: `search`, `genre`, `authorId`, `authorName`, `page` (1), `limit` (10, máx 50), `sortBy` (`title`\|`publishedYear`\|`createdAt`), `order` (`asc`\|`desc`).

```
GET /api/books/search?search=amor&genre=Novela&page=1&limit=10&sortBy=publishedYear&order=desc
```
Respuesta:
```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5, "hasNext": true, "hasPrev": false }
}
```

### Estadísticas de autor — `/api/authors/[id]/stats`
```json
{
  "authorId": "...", "authorName": "Gabriel García Márquez", "totalBooks": 15,
  "firstBook": { "title": "La hojarasca", "year": 1955 },
  "latestBook": { "title": "Memoria de mis putas tristes", "year": 2004 },
  "averagePages": 285, "genres": ["Novela", "Cuento"],
  "longestBook": { "title": "Cien años de soledad", "pages": 417 },
  "shortestBook": { "title": "Relato de un náufrago", "pages": 110 }
}
```

---

## 🖥️ Páginas (frontend)

| Ruta | Contenido |
|------|-----------|
| `/` | Dashboard: crear/listar/editar/eliminar autores, estadísticas generales |
| `/books` | Búsqueda en tiempo real, filtros (género/autor), orden, paginación, CRUD de libros |
| `/authors/[id]` | Detalle del autor: info, estadísticas, lista de libros, editar y agregar libros |

---

## ☁️ Despliegue en Vercel

1. Sube el proyecto a GitHub.
2. En Vercel, importa el repositorio (**Root Directory** = `next-api-routes` si el repo contiene la carpeta padre).
3. Agrega la variable de entorno **`DATABASE_URL`** en *Settings → Environment Variables*.
4. Deploy. El `postinstall` genera el cliente de Prisma durante el build.

---

## 📝 Notas técnicas (Next.js 16 / Prisma 7)

- **`params` asíncrono:** en Next.js 16 los `params` de rutas dinámicas son `Promise`; se accede con `const { id } = await params`. En Client Components se usa el hook `useParams()`.
- **Prisma 7 driver adapter:** `new PrismaClient()` requiere un adapter. Aquí se usa `@prisma/adapter-pg` con la `DATABASE_URL` (ver `src/lib/prisma.ts`).
- **URL de la base de datos:** en Prisma 7 ya no va en `schema.prisma`, sino en `prisma.config.ts` (para la CLI) y se lee de `process.env` en runtime.
