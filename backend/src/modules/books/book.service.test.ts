import { mockPrisma } from '../../../test/mocks/prisma.mock';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import * as bookService from './book.service';

describe('BookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listBooks', () => {
    it('should return paginated books', async () => {
      const books = [
        { id: 'book-1', title: 'Book One', status: 'PUBLISHED' },
        { id: 'book-2', title: 'Book Two', status: 'PUBLISHED' },
      ];

      mockPrisma.book.findMany.mockResolvedValue(books);
      mockPrisma.book.count.mockResolvedValue(2);

      const result = await bookService.listBooks({ page: 1, limit: 10 });

      expect(result.books).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('createBook', () => {
    it('should create a book with relations', async () => {
      const dto = {
        title: 'New Book',
        description: 'A great book',
        categoryIds: ['cat-1'],
        authorIds: ['auth-1'],
      };

      mockPrisma.book.create.mockResolvedValue({
        id: 'book-new',
        ...dto,
        status: 'DRAFT',
        createdAt: new Date(),
      });

      const result = await bookService.createBook(dto);

      expect(result.id).toBe('book-new');
      expect(mockPrisma.book.create).toHaveBeenCalled();
    });
  });
});
