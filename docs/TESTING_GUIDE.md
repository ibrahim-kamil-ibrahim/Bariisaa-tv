# Testing Guide — Naik Audio Book & E-Book Platform

> **Phase 38** | Comprehensive testing strategy covering backend (NestJS), mobile (Flutter), and admin panel (React) with unit, integration, widget, and E2E tests.

---

## Table of Contents

1. [Test Stack Overview](#test-stack-overview)
2. [Backend — Unit Tests](#backend--unit-tests)
3. [Backend — Integration Tests](#backend--integration-tests)
4. [Flutter — Unit Tests](#flutter--unit-tests)
5. [Flutter — Widget Tests](#flutter--widget-tests)
6. [Flutter — Integration (E2E) Tests](#flutter--integration-e2e-tests)
7. [Admin Panel — Vitest + RTL](#admin-panel--vitest--rtl)
8. [Test Directory Structure](#test-directory-structure)
9. [Running Commands](#running-commands)
10. [CI/CD Integration](#cicd-integration)

---

## Test Stack Overview

The Naik platform employs a three-pronged testing strategy:

| Project     | Framework           | Assertion     | Mocking           | Coverage Target |
|-------------|---------------------|---------------|-------------------|-----------------|
| Backend     | Jest + Supertest    | Jest matchers | Jest mocks / Prisma | 85%             |
| Mobile      | bloc_test + mocktail | expect/assert | Mocktail          | 80%             |
| Admin Panel | Vitest + RTL        | Vitest matchers | vi.mock()        | 80%             |

All tests run in CI via GitHub Actions. Unit tests run on every push; integration and E2E run on PRs to `main` and `develop`.

---

## Backend — Unit Tests

### Jest Setup

**jest.config.js** (located at `backend/jest.config.js`):

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

**Global test setup** (`backend/test/setup.ts`):

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

**Mock Prisma module** (`backend/test/mocks/prisma.mock.ts`):

```ts
export const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  book: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  coupon: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  subscription: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};
```

### Example: auth.service.test.ts

`backend/src/auth/tests/auth.service.test.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { mockPrisma } from '../../../test/mocks/prisma.mock';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: typeof mockPrisma;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@naik.com' }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      const dto = {
        email: 'newuser@naik.com',
        password: 'StrongPass1!',
        name: 'New User',
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: dto.name,
        password: 'hashed-password',
        role: 'USER',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.signup(dto);

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: dto.email }),
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.signup({
          email: 'existing@naik.com',
          password: 'Pass123!',
          name: 'Existing',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const email = 'user@naik.com';
      const password = 'ValidPass1!';

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email,
        password: await bcrypt.hash(password, 10),
        isVerified: true,
        role: 'USER',
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.login({ email, password });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@naik.com',
        password: await bcrypt.hash('correct', 10),
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        authService.login({ email: 'user@naik.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@naik.com',
        refreshToken: 'valid-refresh-token',
      });

      const result = await authService.refreshToken({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@naik.com',
        refreshToken: 'different-token',
      });

      await expect(
        authService.refreshToken({ refreshToken: 'wrong-token' }),
      ).rejects.toThrow('Invalid refresh token');
    });
  });
});
```

### Example: book.service.test.ts

`backend/src/book/tests/book.service.test.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from '../book.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrisma } from '../../../test/mocks/prisma.mock';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('BookService', () => {
  let bookService: BookService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    bookService = module.get<BookService>(BookService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const adminUser = { id: 'admin-1', role: 'ADMIN' };
    const createDto = {
      title: 'Test Book',
      description: 'A test book description.',
      price: 9.99,
      categories: ['fiction'],
      authors: ['Author One'],
    };

    it('should create a book when user is admin', async () => {
      prisma.book.create.mockResolvedValue({
        id: 'book-1',
        ...createDto,
        coverImage: null,
        audioFile: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await bookService.create(adminUser, createDto);

      expect(result).toHaveProperty('id', 'book-1');
      expect(result).toHaveProperty('title', 'Test Book');
      expect(prisma.book.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not admin', async () => {
      const userUser = { id: 'user-1', role: 'USER' };

      await expect(bookService.create(userUser, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('list', () => {
    it('should return paginated books', async () => {
      const books = [
        { id: 'book-1', title: 'Book 1', price: 9.99, categories: ['fiction'] },
        { id: 'book-2', title: 'Book 2', price: 14.99, categories: ['non-fiction'] },
      ];

      prisma.book.findMany.mockResolvedValue(books);
      prisma.book.count.mockResolvedValue(2);

      const result = await bookService.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toHaveProperty('total', 2);
      expect(result.meta).toHaveProperty('page', 1);
    });

    it('should filter books by category', async () => {
      prisma.book.findMany.mockResolvedValue([
        { id: 'book-1', title: 'Fiction Book', categories: ['fiction'] },
      ]);
      prisma.book.count.mockResolvedValue(1);

      const result = await bookService.list({ page: 1, limit: 10, category: 'fiction' });

      expect(result.data).toHaveLength(1);
      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: { has: 'fiction' },
          }),
        }),
      );
    });
  });

  describe('search', () => {
    it('should return books matching search query', async () => {
      prisma.book.findMany.mockResolvedValue([
        { id: 'book-1', title: 'Harry Potter', price: 19.99 },
      ]);
      prisma.book.count.mockResolvedValue(1);

      const result = await bookService.search({ q: 'harry', page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Harry Potter');
    });

    it('should return empty array when no matches', async () => {
      prisma.book.findMany.mockResolvedValue([]);
      prisma.book.count.mockResolvedValue(0);

      const result = await bookService.search({ q: 'zzzznotfound', page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
```

### Example: coupon.service.test.ts

`backend/src/coupon/tests/coupon.service.test.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from '../coupon.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrisma } from '../../../test/mocks/prisma.mock';
import { BadRequestException } from '@nestjs/common';

describe('CouponService', () => {
  let couponService: CouponService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    couponService = module.get<CouponService>(CouponService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return coupon details for valid code', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000);

      prisma.coupon.findFirst.mockResolvedValue({
        id: 'coupon-1',
        code: 'WELCOME20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 0,
        maxUsageCount: 100,
        usedCount: 5,
        isActive: true,
        expiresAt: future,
      });

      const result = await couponService.validate('WELCOME20');

      expect(result).toHaveProperty('code', 'WELCOME20');
      expect(result).toHaveProperty('discountValue', 20);
    });

    it('should throw for expired coupon', async () => {
      const past = new Date(Date.now() - 86400000);

      prisma.coupon.findFirst.mockResolvedValue({
        id: 'coupon-1',
        code: 'EXPIRED',
        expiresAt: past,
        isActive: true,
      });

      await expect(couponService.validate('EXPIRED')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw for exhausted coupon', async () => {
      prisma.coupon.findFirst.mockResolvedValue({
        id: 'coupon-1',
        code: 'EXHAUSTED',
        maxUsageCount: 100,
        usedCount: 100,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(couponService.validate('EXHAUSTED')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('apply', () => {
    it('should calculate discounted amount for percentage coupon', async () => {
      const result = await couponService.apply(100, {
        discountType: 'PERCENTAGE',
        discountValue: 20,
      } as any);

      expect(result).toEqual({
        originalAmount: 100,
        discountAmount: 20,
        finalAmount: 80,
      });
    });

    it('should calculate discounted amount for fixed coupon', async () => {
      const result = await couponService.apply(50, {
        discountType: 'FIXED',
        discountValue: 15,
      } as any);

      expect(result).toEqual({
        originalAmount: 50,
        discountAmount: 15,
        finalAmount: 35,
      });
    });

    it('should not go below zero', async () => {
      const result = await couponService.apply(5, {
        discountType: 'FIXED',
        discountValue: 20,
      } as any);

      expect(result.finalAmount).toBe(0);
    });
  });
});
```

---

## Backend — Integration Tests

### Supertest Setup

`backend/test/integration/setup.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

let app: INestApplication;
let prisma: PrismaService;
let moduleFixture: TestingModule;

beforeAll(async () => {
  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  prisma = app.get<PrismaService>(PrismaService);

  // Clean test database
  await prisma.$transaction([
    prisma.purchase.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.couponUsage.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.review.deleteMany(),
    prisma.book.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await app.close();
});

export { app, prisma, request };
```

### Example: auth.integration.test.ts

`backend/test/integration/auth.integration.test.ts`:

```ts
import { app, request, prisma } from './setup';

describe('Auth Flow (Integration)', () => {
  const testUser = {
    email: `test-${Date.now()}@naik.com`,
    password: 'StrongPass1!',
    name: 'Test User',
  };

  let verificationToken: string;
  let accessToken: string;
  let refreshToken: string;

  describe('POST /api/auth/signup', () => {
    it('should register a new user and return verification token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('verificationToken');

      verificationToken = res.body.data.verificationToken;
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(testUser)
        .expect(409);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'weak@naik.com', password: '123' })
        .expect(400);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with verified credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('email', testUser.email);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPass1!' })
        .expect(401);
    });

    it('should reject unverified user', async () => {
      // Create unverified user
      const unverifiedEmail = `unverified-${Date.now()}@naik.com`;
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: unverifiedEmail, password: 'StrongPass1!', name: 'Unverified' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: unverifiedEmail, password: 'StrongPass1!' })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
```

### Example: book.integration.test.ts

`backend/test/integration/book.integration.test.ts`:

```ts
import { app, request, prisma } from './setup';

describe('Book Flow (Integration)', () => {
  let adminToken: string;
  let userToken: string;
  let createdBookId: string;

  beforeAll(async () => {
    // Create admin user
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: `admin-${Date.now()}@naik.com`,
        password: 'AdminPass1!',
        name: 'Admin User',
      });

    // Manually set role to ADMIN in test DB
    const adminUser = await prisma.user.findUnique({
      where: { email: `admin-${Date.now()}@naik.com` },
    });
    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: 'ADMIN', isVerified: true },
      });
    }

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `admin-${Date.now()}@naik.com`,
        password: 'AdminPass1!',
      });

    adminToken = adminLogin.body.data.accessToken;

    // Create regular user
    const userRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: `user-${Date.now()}@naik.com`,
        password: 'UserPass1!',
        name: 'Normal User',
      });

    const userLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `user-${Date.now()}@naik.com`,
        password: 'UserPass1!',
      });

    userToken = userLogin.body.data.accessToken;
  });

  describe('POST /api/books (Admin)', () => {
    it('should create a book when admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Integration Test Book',
          description: 'A book created during integration testing.',
          price: 12.99,
          categories: ['fiction', 'mystery'],
          authors: ['Test Author'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Integration Test Book');

      createdBookId = res.body.data.id;
    });

    it('should reject book creation for non-admin', async () => {
      await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Unauthorized Book',
          description: 'Should not be created.',
          price: 5.99,
        })
        .expect(403);
    });
  });

  describe('GET /api/books', () => {
    it('should list all books for any user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should list books without auth for public', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/books')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return book details by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/books/${createdBookId}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdBookId);
      expect(res.body.data.title).toBe('Integration Test Book');
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .get('/api/books/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/books/:id (Admin)', () => {
    it('should update book details', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Book Title', price: 15.99 })
        .expect(200);

      expect(res.body.data.title).toBe('Updated Book Title');
      expect(res.body.data.price).toBe(15.99);
    });
  });

  describe('DELETE /api/books/:id (Admin)', () => {
    it('should soft-delete a book', async () => {
      await request(app.getHttpServer())
        .delete(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deleted = await request(app.getHttpServer())
        .get(`/api/books/${createdBookId}`)
        .expect(404);

      expect(deleted.body.success).toBe(false);
    });
  });
});
```

---

## Flutter — Unit Tests

### Test Setup

**mocktail mocks** (`mobile/test/helpers/mocks.dart`):

```dart
import 'package:mocktail/mocktail.dart';
import 'package:naik/data/repositories/auth_repository.dart';
import 'package:naik/data/repositories/book_repository.dart';
import 'package:naik/data/repositories/subscription_repository.dart';

class MockAuthRepository extends Mock implements AuthRepository {}
class MockBookRepository extends Mock implements BookRepository {}
class MockSubscriptionRepository extends Mock implements SubscriptionRepository {}
```

**pubspec.yaml test dependencies**:

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  bloc_test: ^9.1.4
  mocktail: ^1.0.1
  integration_test:
    sdk: flutter
```

### Example: auth_cubit.test.dart

`mobile/test/blocs/auth_cubit.test.dart`:

```dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naik/blocs/auth/auth_cubit.dart';
import 'package:naik/blocs/auth/auth_state.dart';
import 'package:naik/data/models/user_model.dart';
import 'package:naik/data/repositories/auth_repository.dart';
import 'package:naik/core/exceptions/auth_exception.dart';
import '../helpers/mocks.dart';

void main() {
  late AuthCubit authCubit;
  late MockAuthRepository mockAuthRepository;

  const tUser = UserModel(
    id: 'user-1',
    email: 'test@naik.com',
    name: 'Test User',
    role: 'USER',
    isVerified: true,
  );

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    authCubit = AuthCubit(authRepository: mockAuthRepository);
  });

  tearDown(() {
    authCubit.close();
  });

  group('AuthCubit - Signup', () {
    blocTest<AuthCubit, AuthState>(
      'emits [loading, authenticated] when signup succeeds',
      build: () => authCubit,
      act: (cubit) => cubit.signup(
        email: 'test@naik.com',
        password: 'StrongPass1!',
        name: 'Test User',
      ),
      setUp: () {
        when(() => mockAuthRepository.signup(
          email: any(named: 'email'),
          password: any(named: 'password'),
          name: any(named: 'name'),
        )).thenAnswer((_) async => tUser);
      },
      expect: () => [
        AuthState.initial().copyWith(status: AuthStatus.loading),
        AuthState.initial().copyWith(
          status: AuthStatus.authenticated,
          user: tUser,
          message: 'Signup successful! Please verify your email.',
        ),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits [loading, error] when signup fails',
      build: () => authCubit,
      act: (cubit) => cubit.signup(
        email: 'exists@naik.com',
        password: 'StrongPass1!',
        name: 'Existing',
      ),
      setUp: () {
        when(() => mockAuthRepository.signup(
          email: any(named: 'email'),
          password: any(named: 'password'),
          name: any(named: 'name'),
        )).thenThrow(AuthException('Email already registered'));
      },
      expect: () => [
        AuthState.initial().copyWith(status: AuthStatus.loading),
        AuthState.initial().copyWith(
          status: AuthStatus.error,
          message: 'Email already registered',
        ),
      ],
    );
  });

  group('AuthCubit - Login', () {
    blocTest<AuthCubit, AuthState>(
      'emits [loading, authenticated] when login succeeds',
      build: () => authCubit,
      act: (cubit) => cubit.login(
        email: 'test@naik.com',
        password: 'StrongPass1!',
      ),
      setUp: () {
        when(() => mockAuthRepository.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenAnswer((_) async => tUser);
      },
      expect: () => [
        AuthState.initial().copyWith(status: AuthStatus.loading),
        AuthState.initial().copyWith(
          status: AuthStatus.authenticated,
          user: tUser,
          message: 'Login successful!',
        ),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits [loading, error] when login fails with wrong credentials',
      build: () => authCubit,
      act: (cubit) => cubit.login(
        email: 'test@naik.com',
        password: 'WrongPass1!',
      ),
      setUp: () {
        when(() => mockAuthRepository.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenThrow(AuthException('Invalid credentials'));
      },
      expect: () => [
        AuthState.initial().copyWith(status: AuthStatus.loading),
        AuthState.initial().copyWith(
          status: AuthStatus.error,
          message: 'Invalid credentials',
        ),
      ],
    );

    blocTest<AuthCubit, AuthState>(
      'emits [loading, error] when email not verified',
      build: () => authCubit,
      act: (cubit) => cubit.login(
        email: 'unverified@naik.com',
        password: 'StrongPass1!',
      ),
      setUp: () {
        when(() => mockAuthRepository.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenThrow(AuthException('Please verify your email first'));
      },
      expect: () => [
        AuthState.initial().copyWith(status: AuthStatus.loading),
        AuthState.initial().copyWith(
          status: AuthStatus.error,
          message: 'Please verify your email first',
        ),
      ],
    );
  });

  group('AuthCubit - Logout', () {
    blocTest<AuthCubit, AuthState>(
      'emits [unauthenticated] when logout succeeds',
      build: () => authCubit,
      seed: () => AuthState.initial().copyWith(
        status: AuthStatus.authenticated,
        user: tUser,
      ),
      act: (cubit) => cubit.logout(),
      setUp: () {
        when(() => mockAuthRepository.logout()).thenAnswer((_) async {});
      },
      expect: () => [
        AuthState.initial().copyWith(status: AuthStatus.unauthenticated),
      ],
    );
  });
});
```

### Example: home_cubit.test.dart

`mobile/test/blocs/home_cubit.test.dart`:

```dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naik/blocs/home/home_cubit.dart';
import 'package:naik/blocs/home/home_state.dart';
import 'package:naik/data/models/book_model.dart';
import 'package:naik/data/repositories/book_repository.dart';
import '../helpers/mocks.dart';

void main() {
  late HomeCubit homeCubit;
  late MockBookRepository mockBookRepository;

  final tBooks = List.generate(
    5,
    (i) => BookModel(
      id: 'book-$i',
      title: 'Book $i',
      author: 'Author $i',
      price: 9.99 + i,
      coverImage: 'https://cdn.naik.com/covers/book-$i.jpg',
      categories: ['fiction'],
    ),
  );

  setUp(() {
    mockBookRepository = MockBookRepository();
    homeCubit = HomeCubit(bookRepository: mockBookRepository);
  });

  tearDown(() {
    homeCubit.close();
  });

  group('HomeCubit - loadSections', () {
    blocTest<HomeCubit, HomeState>(
      'emits [loading, loaded] with sections when API succeeds',
      build: () => homeCubit,
      act: (cubit) => cubit.loadSections(),
      setUp: () {
        when(() => mockBookRepository.getNewReleases())
            .thenAnswer((_) async => tBooks.take(3).toList());
        when(() => mockBookRepository.getTrending())
            .thenAnswer((_) async => tBooks);
        when(() => mockBookRepository.getRecommended())
            .thenAnswer((_) async => tBooks.take(2).toList());
      },
      expect: () => [
        HomeState.initial().copyWith(status: HomeStatus.loading),
        HomeState.initial().copyWith(
          status: HomeStatus.loaded,
          newReleases: tBooks.take(3).toList(),
          trending: tBooks,
          recommended: tBooks.take(2).toList(),
        ),
      ],
    );

    blocTest<HomeCubit, HomeState>(
      'emits [loading, error] when API fails',
      build: () => homeCubit,
      act: (cubit) => cubit.loadSections(),
      setUp: () {
        when(() => mockBookRepository.getNewReleases())
            .thenThrow(Exception('Network error'));
      },
      expect: () => [
        HomeState.initial().copyWith(status: HomeStatus.loading),
        HomeState.initial().copyWith(
          status: HomeStatus.error,
          message: 'Failed to load home sections',
        ),
      ],
    );
  });
});
```

---

## Flutter — Widget Tests

### Example: book_card_test.dart

`mobile/test/widgets/book_card_test.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naik/data/models/book_model.dart';
import 'package:naik/widgets/book_card.dart';

void main() {
  final tBook = BookModel(
    id: 'book-1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    price: 12.99,
    coverImage: 'https://cdn.naik.com/covers/gatsby.jpg',
    categories: ['fiction', 'classic'],
    rating: 4.5,
    reviewCount: 328,
  });

  group('BookCard Widget', () {
    testWidgets('displays book title and author', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(book: tBook, onTap: () {}),
          ),
        ),
      );

      expect(find.text('The Great Gatsby'), findsOneWidget);
      expect(find.text('F. Scott Fitzgerald'), findsOneWidget);
    });

    testWidgets('displays price correctly', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(book: tBook, onTap: () {}),
          ),
        ),
      );

      expect(find.text('\$12.99'), findsOneWidget);
    });

    testWidgets('displays star rating', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(book: tBook, onTap: () {}),
          ),
        ),
      );

      expect(find.byIcon(Icons.star), findsOneWidget);
      expect(find.text('4.5'), findsOneWidget);
      expect(find.text('(328)'), findsOneWidget);
    });

    testWidgets('renders cover image', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(book: tBook, onTap: () {}),
          ),
        ),
      );

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('triggers onTap callback when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(
              book: tBook,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(GestureDetector).first);
      expect(tapped, isTrue);
    });

    testWidgets('shows free badge when price is zero', (tester) async {
      const freeBook = BookModel(
        id: 'book-free',
        title: 'Free Book',
        author: 'Author',
        price: 0,
        coverImage: null,
        categories: ['fiction'],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(book: freeBook, onTap: () {}),
          ),
        ),
      );

      expect(find.text('Free'), findsOneWidget);
    });

    testWidgets('shows placeholder when no cover image', (tester) async {
      const noCoverBook = BookModel(
        id: 'book-nc',
        title: 'No Cover',
        author: 'Author',
        price: 5.99,
        coverImage: null,
        categories: ['fiction'],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookCard(book: noCoverBook, onTap: () {}),
          ),
        ),
      );

      expect(find.byIcon(Icons.book), findsOneWidget);
    });
  });
}
```

---

## Flutter — Integration (E2E) Tests

### Setup

`mobile/test_driver/integration_test.dart`:

```dart
import 'package:integration_test/integration_test_driver.dart';

Future<void> main() => integrationDriver();
```

### Example: app_flow_test.dart

`mobile/test/integration/app_flow_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:naik/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Flow E2E', () {
    testWidgets('full app flow: launch -> login -> browse -> read',
        (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Splash screen should appear briefly
      await tester.pump(Duration(seconds: 3));
      await tester.pumpAndSettle();

      // Should be on login screen
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Welcome Back'), findsOneWidget);

      // Fill login form
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'demo@naik.com',
      );
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'DemoPass1!',
      );

      // Tap sign in button
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Should navigate to home screen
      expect(find.text('Discover'), findsOneWidget);
      expect(find.text('New Releases'), findsOneWidget);

      // Scroll down to browse books
      await tester.scrollUntilVisible(
        find.text('Trending Now'),
        200,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();

      // Tap on a book card
      await tester.tap(find.byType(GestureDetector).first);
      await tester.pumpAndSettle();

      // Should be on book detail screen
      expect(find.text('Listen Now'), findsOneWidget);
      expect(find.text('Read Now'), findsOneWidget);

      // Tap "Read Now" button
      await tester.tap(find.text('Read Now'));
      await tester.pumpAndSettle();

      // Should be on reader screen
      expect(find.byType(Scrollable), findsOneWidget);

      // Verify reader content is displayed
      final readerContent = find.byType(Scrollable);
      expect(readerContent, findsOneWidget);

      // Go back
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();

      // Should be back on book detail
      expect(find.text('Listen Now'), findsOneWidget);

      // Navigate to profile
      await tester.tap(find.byIcon(Icons.person));
      await tester.pumpAndSettle();

      expect(find.text('My Library'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('handles invalid login gracefully', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Wait for navigation
      await tester.pump(Duration(seconds: 3));
      await tester.pumpAndSettle();

      // Enter invalid credentials
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'wrong@naik.com',
      );
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'wrong',
      );

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Should show error message
      expect(find.textContaining('Invalid'), findsOneWidget);
      expect(find.textContaining('error'), findsOneWidget);
    });
  });
}
```

---

## Admin Panel — Vitest + RTL

### Setup

`admin/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock API client
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@naik.com', role: 'ADMIN' },
    isAuthenticated: true,
  }),
}));
```

**vitest.config.ts**:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

### Example: DashboardPage Test

`admin/src/pages/Dashboard/__tests__/DashboardPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import { api } from '../../../lib/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all stat cards', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          totalUsers: 1250,
          totalBooks: 340,
          totalRevenue: 28450,
          activeSubscriptions: 890,
          newUsersThisMonth: 145,
          popularCategory: 'Fiction',
        },
      },
    });

    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('340')).toBeInTheDocument();
      expect(screen.getByText('$28,450')).toBeInTheDocument();
      expect(screen.getByText('890')).toBeInTheDocument();
    });
  });

  it('displays loading skeletons initially', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />, { wrapper });

    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });

  it('handles API error gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('renders revenue chart', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          totalUsers: 1250,
          totalBooks: 340,
          totalRevenue: 28450,
          activeSubscriptions: 890,
          newUsersThisMonth: 145,
          popularCategory: 'Fiction',
        },
      },
    });

    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    });
  });

  it('shows recent transactions table', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          totalUsers: 1250,
          totalBooks: 340,
          totalRevenue: 28450,
          activeSubscriptions: 890,
          newUsersThisMonth: 145,
          popularCategory: 'Fiction',
          recentTransactions: [
            { id: 't1', user: 'john@test.com', amount: 12.99, date: '2025-01-15' },
            { id: 't2', user: 'jane@test.com', amount: 9.99, date: '2025-01-14' },
          ],
        },
      },
    });

    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
      expect(screen.getByText('jane@test.com')).toBeInTheDocument();
      expect(screen.getByText('$12.99')).toBeInTheDocument();
    });
  });
});
```

### Example: BookFormPage Test

`admin/src/pages/Books/__tests__/BookFormPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import BookFormPage from '../BookFormPage';
import { api } from '../../../lib/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('BookFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create book form', () => {
    render(<BookFormPage />, { wrapper });

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/authors/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create book/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    const user = userEvent.setup();
    render(<BookFormPage />, { wrapper });

    await user.click(screen.getByRole('button', { name: /create book/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/price is required/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one category/i)).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, data: { id: 'book-new' } },
    });

    render(<BookFormPage />, { wrapper });

    await user.type(screen.getByLabelText(/title/i), 'New Test Book');
    await user.type(screen.getByLabelText(/description/i), 'A test book description.');
    await user.type(screen.getByLabelText(/price/i), '14.99');
    await user.type(screen.getByLabelText(/categories/i), 'fiction,mystery');
    await user.type(screen.getByLabelText(/authors/i), 'Author One');

    await user.click(screen.getByRole('button', { name: /create book/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/books', {
        title: 'New Test Book',
        description: 'A test book description.',
        price: 14.99,
        categories: ['fiction', 'mystery'],
        authors: ['Author One'],
      });
    });
  });

  it('handles image upload', async () => {
    const user = userEvent.setup();
    render(<BookFormPage />, { wrapper });

    const file = new File(['(fake-image)'], 'cover.png', { type: 'image/png' });
    const input = screen.getByLabelText(/cover image/i);

    await user.upload(input, file);

    expect(screen.getByText(/cover.png/i)).toBeInTheDocument();
    expect(screen.getByAltText(/cover preview/i)).toBeInTheDocument();
  });

  it('handles API error on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(new Error('Server error'));

    render(<BookFormPage />, { wrapper });

    await user.type(screen.getByLabelText(/title/i), 'Test Book');
    await user.type(screen.getByLabelText(/description/i), 'Description');
    await user.type(screen.getByLabelText(/price/i), '9.99');
    await user.type(screen.getByLabelText(/categories/i), 'fiction');
    await user.type(screen.getByLabelText(/authors/i), 'Author');

    await user.click(screen.getByRole('button', { name: /create book/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it('loads existing book data in edit mode', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'book-1',
          title: 'Existing Book',
          description: 'Existing description.',
          price: 19.99,
          categories: ['fiction'],
          authors: ['Existing Author'],
          coverImage: 'https://cdn.naik.com/covers/existing.jpg',
        },
      },
    });

    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useParams: () => ({ id: 'book-1' }),
    }));

    render(<BookFormPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Book');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description.');
      expect(screen.getByLabelText(/price/i)).toHaveValue(19.99);
    });
  });
});
```

---

## Test Directory Structure

```
naik-platform/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   └── tests/
│   │   │       └── auth.service.test.ts
│   │   ├── book/
│   │   │   └── tests/
│   │   │       └── book.service.test.ts
│   │   ├── coupon/
│   │   │   └── tests/
│   │   │       └── coupon.service.test.ts
│   │   └── ... (other modules)
│   ├── test/
│   │   ├── mocks/
│   │   │   └── prisma.mock.ts
│   │   ├── integration/
│   │   │   ├── setup.ts
│   │   │   ├── auth.integration.test.ts
│   │   │   └── book.integration.test.ts
│   │   └── setup.ts
│   ├── jest.config.js
│   └── jest-e2e.config.js
│
├── mobile/
│   └── test/
│       ├── helpers/
│       │   └── mocks.dart
│       ├── blocs/
│       │   ├── auth_cubit.test.dart
│       │   └── home_cubit.test.dart
│       ├── widgets/
│       │   └── book_card_test.dart
│       ├── integration/
│       │   └── app_flow_test.dart
│       └── test_driver/
│           └── integration_test.dart
│
├── admin/
│   └── src/
│       ├── test/
│       │   └── setup.ts
│       └── pages/
│           ├── Dashboard/
│           │   └── __tests__/
│           │       └── DashboardPage.test.tsx
│           └── Books/
│               └── __tests__/
│                   └── BookFormPage.test.tsx
│
└── .github/
    └── workflows/
        ├── backend.yml
        └── mobile_android.yml
```

---

## Running Commands

### Backend

```bash
# Unit tests
cd backend
npm run test

# Unit tests with coverage
npm run test:cov

# Integration tests
npm run test:e2e

# Watch mode
npm run test:watch

# Specific test file
npx jest src/auth/tests/auth.service.test.ts --config jest.config.js

# Integration test file
npx jest test/integration/auth.integration.test.ts --config jest-e2e.config.js
```

### Flutter

```bash
# Unit and widget tests
cd mobile
flutter test

# Specific test file
flutter test test/blocs/auth_cubit.test.dart

# Coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Integration tests (requires connected device/emulator)
flutter test integration_test/app_flow_test.dart

# Integration test with driver
flutter drive --driver=test_driver/integration_test.dart --target=test/integration/app_flow_test.dart
```

### Admin Panel

```bash
# All tests
cd admin
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# UI mode (Vitest UI)
npm run test:ui

# Specific file
npx vitest run src/pages/Dashboard/__tests__/DashboardPage.test.tsx
```

### All Projects (Root)

```bash
# Run all backend + admin tests
npm run test

# Run all backend, admin, and mobile tests
npm run test:all
```

---

## CI/CD Integration

### GitHub Actions — Backend

`.github/workflows/backend.yml`:

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: naik_test
          POSTGRES_PASSWORD: naik_test_pass
          POSTGRES_DB: naik_test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Lint
        working-directory: backend
        run: npm run lint

      - name: Generate Prisma client
        working-directory: backend
        run: npx prisma generate
        env:
          DATABASE_URL: postgresql://naik_test:naik_test_pass@localhost:5432/naik_test_db

      - name: Run migrations
        working-directory: backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://naik_test:naik_test_pass@localhost:5432/naik_test_db

      - name: Run unit tests
        working-directory: backend
        run: npm run test:cov
        env:
          DATABASE_URL: postgresql://naik_test:naik_test_pass@localhost:5432/naik_test_db
          JWT_SECRET: test-jwt-secret
          JWT_REFRESH_SECRET: test-refresh-secret

      - name: Run integration tests
        working-directory: backend
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://naik_test:naik_test_pass@localhost:5432/naik_test_db
          JWT_SECRET: test-jwt-secret
          JWT_REFRESH_SECRET: test-refresh-secret

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: backend-coverage
          path: backend/coverage/

  deploy:
    name: Deploy to Production
    needs: lint-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Build
        working-directory: backend
        run: npm run build

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/naik/backend
            git pull origin main
            npm ci
            npm run build
            npx prisma migrate deploy
            pm2 restart naik-backend
```

### GitHub Actions — Mobile Android

`.github/workflows/mobile_android.yml`:

```yaml
name: Mobile Android CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'mobile/**'
      - '.github/workflows/mobile_android.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'mobile/**'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'

      - name: Install dependencies
        working-directory: mobile
        run: flutter pub get

      - name: Analyze
        working-directory: mobile
        run: flutter analyze

      - name: Run unit & widget tests
        working-directory: mobile
        run: flutter test --coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: mobile-coverage
          path: mobile/coverage/

  build-and-deploy:
    name: Build AAB & Deploy
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'

      - name: Install dependencies
        working-directory: mobile
        run: flutter pub get

      - name: Decode Keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > mobile/android/app/naik-keystore.jks

      - name: Create key.properties
        run: |
          echo "storeFile=naik-keystore.jks" > mobile/android/key.properties
          echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" >> mobile/android/key.properties
          echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> mobile/android/key.properties
          echo "keyAlias=${{ secrets.KEY_ALIAS }}" >> mobile/android/key.properties

      - name: Build AAB
        working-directory: mobile
        run: flutter build appbundle --release

      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.naik.app
          releaseFile: mobile/build/app/outputs/bundle/release/app-release.aab
          track: internal
          status: completed
          inAppUpdatePriority: 1
```

---

## Best Practices

1. **Test Isolation**: Each test must set up its own data and clean up after itself. Use `beforeEach` and `afterEach` hooks.

2. **Don't Mock What You Don't Own**: Mock your own abstractions (repositories, services), not third-party libraries directly. Use wrappers around external APIs.

3. **Fake Data Factories**: Create reusable factories for test data:

```ts
// backend/test/factories/user.factory.ts
export const createTestUser = (overrides = {}) => ({
  id: `user-${crypto.randomUUID()}`,
  email: `test-${Date.now()}@naik.com`,
  password: 'ValidPass1!',
  name: 'Test User',
  role: 'USER',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

4. **Naming Convention**: `[feature].[type].test.[ext]` — e.g., `auth.service.test.ts`, `book_card_test.dart`, `DashboardPage.test.tsx`.

5. **Coverage Thresholds**: Configure minimum coverage in Jest/Vitest config and fail CI when thresholds are not met.

6. **Slow Tests**: Mark E2E and integration tests with a `--runInBand` tag or separate config to avoid parallel conflicts with the database.

7. **Seeds for Integration**: Use `prisma db seed` to populate reference data (categories, admin user) before integration test runs.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Prisma tests fail with connection error | Ensure test DB is running and `DATABASE_URL` points to it. Use `testcontainers` for ephemeral DB. |
| Flutter widget test can't find widget | Use `find.byKey()` instead of `find.text()`. Wrap pump in `pumpAndSettle()`. |
| Vitest can't resolve imports | Check `vite.config.ts` alias matches `tsconfig.json` paths. |
| Integration test timeout | Increase `testTimeout` in Jest config. Run with `--runInBand`. |
| Mock not being called | Verify mock instance is passed correctly. Use `expect().toHaveBeenCalled()` with `console.log` in the mock. |
| Flutter test hangs | Ensure all `pumpAndSettle()` calls have a timeout. Remove infinite animations in test mode. |
| Mocktail `MissingStubError` | Register stubs with `when()` in `setUp()` for every method the test will call. |
