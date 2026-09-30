import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createCategory(data: { name: string; description?: string; parentId?: string; imageUrl?: string; iconEmoji?: string; route?: string; sortOrder?: number }) {
  if (data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError('Parent category not found', 404);
  }

  let slug = slugify(data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      slug,
      parentId: data.parentId,
      imageUrl: data.imageUrl,
      iconEmoji: data.iconEmoji,
      route: data.route,
      sortOrder: data.sortOrder ?? 0,
    },
    include: {
      parent: true,
      _count: { select: { books: true } },
    },
  });

  return category;
}

export async function updateCategory(id: string, data: { name?: string; description?: string; parentId?: string; imageUrl?: string; iconEmoji?: string; route?: string; sortOrder?: number }) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found', 404);

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    let slug = slugify(data.name);
    const slugConflict = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (slugConflict) {
      slug = `${slug}-${Date.now()}`;
    }
    updateData.slug = slug;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.parentId !== undefined) {
    if (data.parentId === id) throw new AppError('Category cannot be its own parent', 400);
    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new AppError('Parent category not found', 404);
    }
    updateData.parentId = data.parentId;
  }

  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.iconEmoji !== undefined) updateData.iconEmoji = data.iconEmoji;
  if (data.route !== undefined) updateData.route = data.route;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      parent: true,
      _count: { select: { books: true } },
    },
  });

  return category;
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  });

  if (!existing) throw new AppError('Category not found', 404);

  await prisma.bookCategory.deleteMany({ where: { categoryId: id } });

  await prisma.category.updateMany({
    where: { parentId: id },
    data: { parentId: null },
  });

  await prisma.category.delete({ where: { id } });

  return { message: 'Category deleted successfully' };
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        include: { _count: { select: { books: true } } },
      },
      _count: { select: { books: true } },
    },
  });

  if (!category) throw new AppError('Category not found', 404);

  return category;
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: {
            include: { _count: { select: { books: true } } },
          },
          _count: { select: { books: true } },
        },
      },
      _count: { select: { books: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return categories;
}

export async function listExploreCategories() {
  const categories = await prisma.category.findMany({
    where: { route: { not: null } },
    orderBy: { sortOrder: 'asc' },
  });

  return categories;
}
