#!/usr/bin/env node
import 'dotenv/config'
import { Client, Databases, ID, Permission, Role } from 'node-appwrite'

// Load ALL of your Appwrite credentials (including the secret API key)
const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const apiKey    = process.env.APPWRITE_API_KEY

if (!endpoint || !projectId || !apiKey) {
  console.error(
    '❌ Missing one of: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY'
  )
  process.exit(1)
}

// Initialize the Node Appwrite client
const client    = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey)

const databases = new Databases(client)

// Your DB & collection IDs
const DATABASE_ID = 'online_exam_db'
const COLLECTIONS = {
  USERS:       'users',
  EXAMS:       'exams',
  QUESTIONS:   'questions',
  SUBMISSIONS: 'submissions',
} as const
type CollectionId = typeof COLLECTIONS[keyof typeof COLLECTIONS]

;(async () => {
  console.log('▶️  Provisioning Appwrite…')

  // 1️⃣  Create the database (if it doesn’t exist)
  try {
    await databases.create(DATABASE_ID, 'Online Examination System', true)
    console.log(`✔️  Database created: ${DATABASE_ID}`)
  } catch (e: any) {
    if (e.code === 409) {
      console.log(`ℹ️  Database already exists: ${DATABASE_ID}`)
    } else {
      console.error('❌ Failed to create database:', e)
      process.exit(1)
    }
  }

  // Helper: ensure collection + attributes
  async function ensure(
    id: CollectionId,
    name: string,
    defineAttrs: () => Promise<void>
  ) {
    // a) create the collection itself
    try {
      await databases.createCollection(
        DATABASE_ID,
        id,
        name,
        [Permission.read(Role.any()), Permission.create(Role.any())],
        true
      )
      console.log(`✔️  Collection created: ${id}`)
    } catch (e: any) {
      if (e.code === 409) {
        console.log(`ℹ️  Collection exists: ${id}`)
      } else {
        console.error(`❌ Failed to create collection ${id}:`, e)
        process.exit(1)
      }
    }

    // b) now define its attributes
    try {
      await defineAttrs()
      console.log(`   ↪️  Attributes ensured on: ${id}`)
    } catch (e) {
      console.error(`❌ Error ensuring attrs on ${id}:`, e)
      process.exit(1)
    }
  }

  // 2️⃣  USERS
  await ensure(COLLECTIONS.USERS, 'Users', async () => {
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'name',      255, true) } catch {}
    try { await databases.createEmailAttribute( DATABASE_ID, COLLECTIONS.USERS, 'email',             true) } catch {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'role',      10,  true) } catch {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'studentId', 50,  false) } catch {}
  })

  // 3️⃣  EXAMS
  await ensure(COLLECTIONS.EXAMS, 'Exams', async () => {
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.EXAMS, 'title',     255, true) } catch {}
    try { await databases.createIntegerAttribute (DATABASE_ID, COLLECTIONS.EXAMS, 'duration',        true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.EXAMS, 'createdBy', 36,  true) } catch {}
    try { await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.EXAMS, 'createdAt',      true) } catch {}
  })

  // 4️⃣  QUESTIONS
  await ensure(COLLECTIONS.QUESTIONS, 'Questions', async () => {
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.QUESTIONS, 'examId',        36,   true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.QUESTIONS, 'text',         1000, true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.QUESTIONS, 'type',         20,   true) } catch {}
    // store array of options as JSON‐string in a string field
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        'options',
        1000,
        false,
        '',   // no default
        true  // isArray
      )
    } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.QUESTIONS, 'correctAnswer',1000, false) } catch {}
    try { await databases.createIntegerAttribute (DATABASE_ID, COLLECTIONS.QUESTIONS, 'order',           true) } catch {}
  })

  // 5️⃣  SUBMISSIONS
  await ensure(COLLECTIONS.SUBMISSIONS, 'Submissions', async () => {
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'examId',      36,  true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'userId',      36,  true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'studentName',255, true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'studentEmail',255, true) } catch {}
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'studentId',   50,  true) } catch {}
    // answers as JSON string
    try { await databases.createStringAttribute  (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'answers', 10000, true) } catch {}
    try { await databases.createIntegerAttribute (DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'score',       false) } catch {}
    try { await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'submittedAt', true) } catch {}
  })

  console.log('🎉  Provisioning complete')
})().catch(err => {
  console.error('❌ Setup failed:', err)
  process.exit(1)
})
