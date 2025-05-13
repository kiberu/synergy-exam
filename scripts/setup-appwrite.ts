#!/usr/bin/env ts-node
import 'dotenv/config'
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite'
import { Permission, Role, ID } from 'node-appwrite'

type CollectionId = typeof COLLECTIONS[keyof typeof COLLECTIONS]

;(async function main() {
  console.log('▶️  Provisioning Appwrite…')

  // Create database if needed
  try {
    await databases.create(DATABASE_ID, 'Online Examination System', true)
    console.log(`✔️  Database created: ${DATABASE_ID}`)
  } catch (e: any) {
    if (e.code === 409) console.log(`ℹ️  Database exists: ${DATABASE_ID}`)
    else throw e
  }

  // Helper: ensure collection exists, then always define its attributes
  async function ensure(
    id: CollectionId,
    name: string,
    defineAttrs: () => Promise<void>
  ) {
    // 1) Create collection if needed
    try {
      await databases.createCollection(
        DATABASE_ID,
        id,
        name,
        [Permission.read(Role.any()), Permission.create(Role.any())],
        true
      )
      console.log(`✔️  Collection created: ${id}`)
    } catch (err: any) {
      if (err.code === 409) console.log(`ℹ️  Collection exists: ${id}`)
      else throw err
    }

    // 2) Always attempt to define attributes (catch 409s per‐attribute)
    try {
      await defineAttrs()
      console.log(`   ↪️  Attributes ensured on: ${id}`)
    } catch (err: any) {
      console.error(`   ⚠️  Error ensuring attributes on ${id}:`, err)
      throw err
    }
  }

  // USERS
  await ensure(COLLECTIONS.USERS, 'Users', async () => {
    // wrap each attribute creation in its own try/catch to skip duplicates
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'name', 255, true)
    } catch {}
    try {
      await databases.createEmailAttribute(DATABASE_ID, COLLECTIONS.USERS, 'email', true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'role', 10, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'studentId', 50, false)
    } catch {}
  })

  // EXAMS
  await ensure(COLLECTIONS.EXAMS, 'Exams', async () => {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.EXAMS, 'title', 255, true)
    } catch {}
    try {
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.EXAMS, 'duration', true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.EXAMS, 'createdBy', 36, true)
    } catch {}
    try {
      await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.EXAMS, 'createdAt', true)
    } catch {}
  })

  // QUESTIONS
  await ensure(COLLECTIONS.QUESTIONS, 'Questions', async () => {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.QUESTIONS, 'examId', 36, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.QUESTIONS, 'text', 1000, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.QUESTIONS, 'type', 20, true)
    } catch {}
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        'options',
        1000,
        false,
        '',
        true
      )
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.QUESTIONS, 'correctAnswer', 1000, false)
    } catch {}
    // ← here is the missing one that was causing your seeder to fail:
    try {
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.QUESTIONS, 'order', true)
    } catch {}
  })

  // SUBMISSIONS
  await ensure(COLLECTIONS.SUBMISSIONS, 'Submissions', async () => {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'examId', 36, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'userId', 36, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'studentName', 255, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'studentEmail', 255, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'studentId', 50, true)
    } catch {}
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'answers', 10000, true)
    } catch {}
    try {
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'score', false)
    } catch {}
    try {
      await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.SUBMISSIONS, 'submittedAt', true)
    } catch {}
  })

  console.log('🎉  Provisioning complete')
})().catch(err => {
  console.error('❌ Setup failed:', err)
  process.exit(1)
})
