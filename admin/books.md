# Books Page — `/books`

## Overview

The Books page is the main catalog management view for the admin panel. It displays a paginated, filterable, sortable table of all books in the database with CRUD operations.

## Route

| Path | Component | Auth |
|------|-----------|------|
| `/books` | `src/pages/books/BooksPage.tsx` | `PrivateRoute` (JWT in localStorage `naik_admin_token`) |

Nested under `src/App.tsx` layout route — sidebar nav link at `src/components/Layout.tsx:70`.

## API

**`GET /api/v1/books`** (backend: `src/modules/books/book.routes.ts` — `optionalAuth`)

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | 1-indexed page number |
| `limit` | number | 20 | Rows per page |
| `search` | string | — | Full-text search on title |
| `status` | enum | `PUBLISHED`* | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `sort` | enum | `newest` | `newest`, `popularity`, `rating`, `alphabetical` |

> *Backend defaults to `PUBLISHED` when no status param sent. Admin sends `status: undefined` for "All" tab, which triggers this default — meaning "All" currently shows only published books.

### Response Shape

```json
{
  "success": true,
  "message": "Books retrieved",
  "data": [ /* Book[] */ ],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

## UI Components Rendered

### PageHeader
- **Title**: "Books"
- **Subtitle**: "Manage your book catalog"
- **Action button**: "Add Book" → navigates to `/books/new`

### Status Tabs
| Tab | Value | Backend `status` param |
|-----|-------|------------------------|
| All | `all` | `undefined` (defaults to PUBLISHED) |
| Draft | `draft` | `DRAFT` |
| Published | `published` | `PUBLISHED` |
| Archived | `archived` | `ARCHIVED` |

### DataTable Columns

| Column | Sortable | Render |
|--------|----------|--------|
| Cover | No | `<Avatar>` 40×56, shows image or first letter of title |
| Title | Yes | Plain text with fontWeight 500 |
| Author | No | `authors.map(a => a.name).join(', ')` or `—` |
| Category | No | `categories.map(c => c.name).join(', ')` or `—` |
| Status | Yes | `<Chip>` — green for Published, gray for Draft, orange for Archived |
| Rating (count) | Yes | `rating.toFixed(1) (ratingCount)` e.g. `4.5 (12)` |
| Actions | No | View (`/books/:id`), Edit (`/books/:id/edit`), Delete (confirm dialog) |

### Pagination
- 20 rows per page (configurable)
- Frontend is 0-indexed, backend is 1-indexed (`page + 1` in API call)

### Delete Flow
1. Click delete icon → `setDeleteDialog(bookId)`
2. `ConfirmDialog` opens with title "Delete Book" and destructive warning
3. Confirm → `DELETE /api/v1/books/:id` (requires `books:delete` permission)
4. Backend soft-deletes: sets `status: 'ARCHIVED'`
5. On success → `invalidateQueries(['books'])` refetches the list
6. Dialog closes

## Data Types

```typescript
interface Book {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  rating?: number;
  ratingCount?: number;
  authors?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
}
```

Full type definition at `src/types/index.ts`.

## Related Pages

| Path | Component | Purpose |
|------|-----------|---------|
| `/books/new` | `BookFormPage.tsx` | Create new book (POST /books) |
| `/books/:id` | `BookDetailPage.tsx` | View book details (GET /books/:id) |
| `/books/:id/edit` | `BookFormPage.tsx` | Edit existing book (PUT /books/:id) |

## Permissions (Backend)

| Action | Permission Required |
|--------|-------------------|
| List books | None (`optionalAuth`) |
| View single book | None (`optionalAuth`) |
| Create book | `books:create` |
| Update book | `books:update` |
| Delete book | `books:delete` |

Users with role `super_admin` bypass all permission checks.

## Current Database State

**0 books** — table renders empty.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/books/BooksPage.tsx` | Main list page component |
| `src/pages/books/BookFormPage.tsx` | Create/edit form |
| `src/pages/books/BookDetailPage.tsx` | Single book detail |
| `src/services/api.ts` | Axios client with auth interceptor |
| `src/types/index.ts` | TypeScript interfaces |
| `src/App.tsx:45-58` | Route definitions |
| `src/components/DataTable.tsx` | Reusable table |
| `src/components/PageHeader.tsx` | Title + action button |
| `src/components/ConfirmDialog.tsx` | Delete confirmation |
| `backend/src/modules/books/book.routes.ts` | Backend endpoints |
| `backend/src/modules/books/book.controller.ts` | Request handlers |
| `backend/src/modules/books/book.service.ts` | Business logic + Prisma queries |
| `backend/src/modules/books/book.validation.ts` | Zod schemas |
