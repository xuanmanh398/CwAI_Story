import { z } from 'zod';

export type UserRole = 'admin' | 'editor' | 'reader';
export type BookStatus = 'ongoing' | 'completed' | 'hiatus';
export type PublicationStatus = 'draft' | 'published' | 'unpublished' | 'removed';
export type SourceType = 'original' | 'licensed_api' | 'licensed_manual';
export type LicenseVerificationStatus = 'unverified' | 'verified' | 'revoked';

// Schemas
export const UserRegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới'),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(100),
});

export const UserLoginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(6),
});

export const BookCreateSchema = z.object({
  title: z.string().min(2, 'Tên truyện ít nhất 2 ký tự').max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  author_id: z.string().nullable().optional(),
  author_name: z.string().optional(), // Nếu tạo tác giả mới
  cover_url: z.string().nullable().optional().or(z.literal('')),
  description: z.string().max(5000).default(''),
  status: z.enum(['ongoing', 'completed', 'hiatus']).default('ongoing'),
  publication_status: z.enum(['draft', 'published', 'unpublished', 'removed']).default('draft'),
  genre_ids: z.array(z.string()).default([]),
  license_owner: z.string().optional(),
  license_type: z.string().optional(),
  permitted_scope: z.string().optional(),
  is_18_plus: z.boolean().or(z.number()).default(false),
  is_premium: z.boolean().or(z.number()).default(false),
});

export const ChapterCreateSchema = z.object({
  book_id: z.string(),
  chapter_number: z.number().int().positive(),
  title: z.string().min(1).max(250),
  slug: z.string().min(1).max(250).regex(/^[a-z0-9-]+$/),
  content: z.string().min(10, 'Nội dung chương phải có ít nhất 10 ký tự'),
  publication_status: z.enum(['draft', 'published', 'unpublished', 'removed']).default('draft'),
});

export const ReadingProgressSchema = z.object({
  book_id: z.string(),
  last_chapter_id: z.string(),
  last_chapter_number: z.number().int().positive(),
  progress_percent: z.number().min(0).max(100).default(0),
});

export const ContentSourceSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  provider_type: z.enum(['mock_internal', 'licensed_rest_api']),
  base_url: z.string().url('Base URL phải là URL hợp lệ'),
  is_active: z.boolean().default(true),
  sync_frequency: z.enum(['manual', 'hourly', 'daily', 'weekly']).default('daily'),
  config_json: z.string().default('{}'),
});

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
