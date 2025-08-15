import { z } from 'zod'

// Schema for book resolution response
export const BookResolveSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  author: z.string(),
  timestamp: z.string(),
})

export type BookResolve = z.infer<typeof BookResolveSchema>

// Schema for book text response  
export const BookTextSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  text: z.string(),
  wordCount: z.number().int().positive(),
  timestamp: z.string(),
  textLength: z.number().int().positive(),
})

export type BookText = z.infer<typeof BookTextSchema>

// Schema for book text preview response
export const BookPreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  preview: z.string(),
  hasMore: z.boolean(),
  wordCount: z.number().int().positive(),
  fullTextLength: z.number().int().positive(),
  timestamp: z.string(),
})

export type BookPreview = z.infer<typeof BookPreviewSchema>

// Error response schema
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  path: z.string().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// Request validation
export const BookIdSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'Book ID must be a numeric string')
    .min(1, 'Book ID cannot be empty')
    .max(10, 'Book ID too long'),
})

export type BookIdRequest = z.infer<typeof BookIdSchema>

// Character analysis schemas
export const CharacterSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
  importance: z.number().int().min(1).max(100),
  mentions: z.number().int().positive(),
  description: z.string().optional(),
})

export type Character = z.infer<typeof CharacterSchema>

export const CharacterAnalysisResultSchema = z.object({
  success: z.boolean(),
  characters: z.array(CharacterSchema),
  method: z.enum(['ollama', 'compromise']),
  processing_time_ms: z.number().positive(),
  text_length: z.number().positive(),
  total_characters: z.number().int().nonnegative(),
  timestamp: z.string(),
})

export type CharacterAnalysisResult = z.infer<typeof CharacterAnalysisResultSchema>

export const CharacterAnalysisRequestSchema = z.object({
  text: z.string().min(100, 'Text must be at least 100 characters long'),
  mode: z.enum(['auto', 'ollama']).default('auto'),
  max_characters: z.number().int().min(1).max(50).default(20),
})

export type CharacterAnalysisRequest = z.infer<typeof CharacterAnalysisRequestSchema>

// Analysis health schema
export const AnalysisHealthSchema = z.object({
  compromise: z.boolean(),
  ollama: z.boolean(),
  timestamp: z.string(),
})

export type AnalysisHealth = z.infer<typeof AnalysisHealthSchema>
