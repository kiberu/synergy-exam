// lib/appwrite.ts
import 'dotenv/config'
import {
  Client,
  Account,
  Databases,
  ID,
  Permission,
  Role,
  Models,
  Query,
} from 'node-appwrite'

// — Initialize Appwrite client —
// Pull in your env vars (make sure you have APPWRITE_API_KEY set server-side!)
const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!
const apiKey    = process.env.APPWRITE_API_KEY!

if (!endpoint || !projectId || !apiKey) {
  console.error(
    '❌ Missing env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY'
  )
  process.exit(1)
}

const client    = new Client()
  .setEndpoint(endpoint)   // Your Appwrite endpoint
  .setProject(projectId)   // Your project ID
  .setKey(apiKey)          // Your secret API key

export const account   = new Account(client)
export const databases = new Databases(client)

// — Database & Collections IDs —
export const DATABASE_ID = 'online_exam_db' as const
export const COLLECTIONS = {
  USERS:       'users',
  EXAMS:       'exams',
  QUESTIONS:   'questions',
  SUBMISSIONS: 'submissions',
} as const
export type CollectionId = typeof COLLECTIONS[keyof typeof COLLECTIONS]

// Re-export Query helpers so callers can do:
// import { Query } from '@/lib/appwrite'
export { Query }

// — CRUD Helpers —

// Create a document, optionally scoped to a specific user
export async function createDocument<T extends Omit<Models.Document, keyof Models.Document>>(
  collectionId: CollectionId,
  data: T,
  userId?: string
): Promise<Models.Document> {
  const permissions = userId
    ? [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    : [Permission.read(Role.any())]

  return databases.createDocument(
    DATABASE_ID,
    collectionId,
    ID.unique(),
    data,
    permissions
  )
}

// List documents; pass in Query.* helpers which return strings
export async function listDocuments(
  collectionId: CollectionId,
  queries: string[] = []
): Promise<Models.DocumentList<Models.Document>> {
  return databases.listDocuments(DATABASE_ID, collectionId, queries)
}

// Get a single document by ID
export async function getDocument(
  collectionId: CollectionId,
  documentId: string
): Promise<Models.Document> {
  return databases.getDocument(DATABASE_ID, collectionId, documentId)
}

// Update a document by ID
export async function updateDocument<T>(
  collectionId: CollectionId,
  documentId: string,
  data: Partial<T>
): Promise<Models.Document> {
  return databases.updateDocument(DATABASE_ID, collectionId, documentId, data)
}

// Delete a document by ID
export async function deleteDocument(
  collectionId: CollectionId,
  documentId: string
): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, collectionId, documentId)
}

// — Your TypeScript model interfaces —
// (so your components can `import type { Exam, Submission } from "@/lib/appwrite"`)

export interface User {
  $id?: string
  name: string
  email: string
  role: 'tutor' | 'student'
  studentId?: string
}

export interface Exam {
  $id?: string
  title: string
  duration: number       // minutes
  createdBy: string      // tutor user ID
  createdAt: string      // ISO date string
}

export interface Question {
  $id?: string
  examId: string
  text: string
  type: 'multiple-choice' | 'text'
  options?: string[]
  correctAnswer?: string
  order: number
}

export interface Submission {
  $id?: string
  examId: string
  userId: string
  studentName: string
  studentEmail: string
  studentId: string
  answers: Record<string,string> // questionId → answer
  score?: number
  submittedAt: string            // ISO date string
}
