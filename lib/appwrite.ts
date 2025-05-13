/// lib/appwrite.ts
import { 
  Client,
  Account,
  Databases,
  ID,
  Permission,
  Role,
  Models,
  Query
} from 'appwrite'

const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

if (!endpoint || !projectId) {
  console.error(
    '[lib/appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID'
  )
}

const client = new Client()
  .setEndpoint(endpoint ?? '')
  .setProject(projectId ?? '')

export const account   = new Account(client)
export const databases = new Databases(client)

export const DATABASE_ID = 'online_exam_db' as const
export const COLLECTIONS = {
  USERS:       'users',
  EXAMS:       'exams',
  QUESTIONS:   'questions',
  SUBMISSIONS: 'submissions',
} as const
export type CollectionId = typeof COLLECTIONS[keyof typeof COLLECTIONS]

export { Query }

/**
 * Now T is constrained to exactly the shape that Appwrite.createDocument expects:
 * “some subset of a Document’s own properties” (i.e. your custom fields).
 */
export async function createDocument<
  T extends Omit<Models.Document, keyof Models.Document>
>(
  collectionId: CollectionId,
  data: T,
  userId?: string
): Promise<Models.Document> {
  const perms = userId
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
    perms
  )
}

/**
 * List documents; pass in Query.* calls (which return strings).
 */
export async function listDocuments(
  collectionId: CollectionId,
  queries: string[] = []
): Promise<Models.DocumentList<Models.Document>> {
  return databases.listDocuments(DATABASE_ID, collectionId, queries)
}

/** Get a single document by ID. */
export async function getDocument(
  collectionId: CollectionId,
  documentId: string
): Promise<Models.Document> {
  return databases.getDocument(DATABASE_ID, collectionId, documentId)
}

/** Update an existing document by ID. */
export async function updateDocument<T>(
  collectionId: CollectionId,
  documentId: string,
  data: Partial<T>
): Promise<Models.Document> {
  return databases.updateDocument(DATABASE_ID, collectionId, documentId, data)
}

/** Delete a document by ID. */
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
