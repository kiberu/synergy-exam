#!/usr/bin/env ts-node

import 'dotenv/config'
import {
  createDocument,
  COLLECTIONS,
  type CollectionId,
} from '../lib/appwrite'

type AnyDoc = Record<string, any>
type ExamKey    = 'exam1' | 'exam2' | 'exam3'
type StudentKey = 'student1' | 'student2'

// Input shapes
interface TutorInput {
  name: string
  email: string
  role: 'tutor'
}
interface StudentInput {
  key: StudentKey
  name: string
  email: string
  role: 'student'
  studentId: string
}
interface ExamInput {
  key: ExamKey
  title: string
  duration: number
  createdAt: string
}
interface QuestionInput {
  examKey: ExamKey
  text: string
  type: 'multiple-choice' | 'text'
  options?: string[]
  correctAnswer?: string
  order: number
}
interface SubmissionInput {
  examKey: ExamKey
  userKey: StudentKey
  studentName: string
  studentEmail: string
  studentId: string
  answers: string[]
  score: number
  submittedAt: string
}

/**
 * Attempts to create a document. If Appwrite rejects an unknown "options" field,
 * strip it out and retry once.
 */
async function safeCreateDocument(
  collectionId: CollectionId,
  data: Record<string, any>,
  userId?: string
): Promise<AnyDoc> {
  try {
    return await createDocument(collectionId, data, userId)
  } catch (err: any) {
    if (
      err.type === 'document_invalid_structure' &&
      /Unknown attribute:\s*"options"/.test(err.message)
    ) {
      // retry without options
      const { options, ...rest } = data
      return await createDocument(collectionId, rest, userId)
    }
    throw err
  }
}

;(async function seed() {
  console.log('🔄  Seeding database…')

  // 1) Raw data
  const tutors: TutorInput[] = [
    { name: "Demo Tutor", email: "tutor@example.com", role: "tutor" },
  ]

  const students: StudentInput[] = [
    { key: 'student1', name: "John Doe",   email: "john@example.com",  role: "student", studentId: "S12345" },
    { key: 'student2', name: "Jane Smith", email: "jane@example.com",  role: "student", studentId: "S12346" },
  ]

  const exams: ExamInput[] = [
    { key: 'exam1', title: "Mathematics Midterm",     duration: 10, createdAt: new Date().toISOString() },
    { key: 'exam2', title: "Physics Quiz",            duration: 15, createdAt: new Date().toISOString() },
    { key: 'exam3', title: "Programming Fundamentals",duration: 20, createdAt: new Date().toISOString() },
  ]

  const questions: QuestionInput[] = [
    { examKey: 'exam1', text: "What is 2 + 2?",                         type: "multiple-choice", options: ["3","4","5","6"],       correctAnswer: "4",  order: 0 },
    { examKey: 'exam1', text: "Value of π to 2 decimals?",              type: "multiple-choice", options: ["3.14","3.15","3.16","3.17"],correctAnswer: "3.14",order: 1 },
    { examKey: 'exam1', text: "Solve 2x + 5 = 15",                     type: "multiple-choice", options: ["4","5","6","7"],       correctAnswer: "5",  order: 2 },
    { examKey: 'exam1', text: "Explain the concept of derivatives.",   type: "text",                                                          order: 3 },
    { examKey: 'exam1', text: "Area of circle radius 5?",              type: "multiple-choice", options: ["25π","10π","5π","15π"],  correctAnswer: "25π",order: 4 },

    { examKey: 'exam2', text: "What is Newton's First Law of Motion?", type: "text",                                                          order: 0 },
    { examKey: 'exam2', text: "SI unit of force?",                     type: "multiple-choice", options: ["Newton","Joule","Watt","Pascal"],correctAnswer: "Newton",order: 1 },
    { examKey: 'exam2', text: "Formula for kinetic energy?",           type: "multiple-choice", options: ["mv²","½mv²","mgh","Fd"],       correctAnswer: "½mv²",order: 2 },

    { examKey: 'exam3', text: "What does HTML stand for?",            type: "multiple-choice", options: ["Hyper Text…","High Tech…","Hyper Transfer…","Home Tool…"],correctAnswer: "Hyper Text…",order: 0 },
    { examKey: 'exam3', text: "Which is NOT a JavaScript data type?", type: "multiple-choice", options: ["String","Boolean","Character","Object"],correctAnswer: "Character", order: 1 },
    { examKey: 'exam3', text: "Explain variables in programming.",    type: "text",                                                          order: 2 },
  ]

  const submissions: SubmissionInput[] = [
    {
      examKey:    'exam1',
      userKey:    'student1',
      studentName: "John Doe",
      studentEmail:"john@example.com",
      studentId:   "S12345",
      answers:     ["4","3.14","5","Derivatives measure rate of change.","25π"],
      score:       85,
      submittedAt:new Date(Date.now() - 86_400_000).toISOString(),
    },
    {
      examKey:    'exam1',
      userKey:    'student2',
      studentName: "Jane Smith",
      studentEmail:"jane@example.com",
      studentId:   "S12346",
      answers:     ["4","3.14","5","The derivative shows input→output.","25π"],
      score:       92,
      submittedAt:new Date(Date.now() - 72_000_000).toISOString(),
    },
  ]

  // 2) Create tutor
  const [ tutorDoc ] = await Promise.all(
    tutors.map(t => createDocument(COLLECTIONS.USERS, t))
  )
  const tutorId = tutorDoc.$id!

  // 3) Create students
  const studentMap: Record<StudentKey, AnyDoc> = Object.fromEntries(
    await Promise.all(
      students.map(s => {
        const { key, ...attrs } = s
        return createDocument(COLLECTIONS.USERS, attrs, tutorId).then(doc => [key, doc])
      })
    )
  ) as Record<StudentKey, AnyDoc>

  // 4) Create exams
  const examMap: Record<ExamKey, AnyDoc> = Object.fromEntries(
    await Promise.all(
      exams.map(e => {
        const { key, ...attrs } = e
        return createDocument(
          COLLECTIONS.EXAMS,
          { ...attrs, createdBy: tutorId },
          tutorId
        ).then(doc => [key, doc])
      })
    )
  ) as Record<ExamKey, AnyDoc>

  // 5) Create questions
  const questionMap: Record<ExamKey, AnyDoc[]> = { exam1: [], exam2: [], exam3: [] }
  for (const q of questions) {
    const payload = {
      examId:       examMap[q.examKey].$id!,
      text:         q.text,
      type:         q.type,
      order:        q.order,
      ...(q.options       ? { options: q.options } : {}),
      ...(q.correctAnswer ? { correctAnswer: q.correctAnswer } : {}),
    }
    const doc = await safeCreateDocument(
      COLLECTIONS.QUESTIONS,
      payload,
      tutorId
    )
    questionMap[q.examKey].push(doc)
  }

  // 6) Create submissions
  for (const sub of submissions) {
    const stud      = studentMap[sub.userKey]
    const docs      = questionMap[sub.examKey]
    const answersObj: Record<string,string> = {}
    docs.forEach((d, i) => (answersObj[d.$id!] = sub.answers[i]))

    // *** stringify answers ***
    await createDocument(
      COLLECTIONS.SUBMISSIONS,
      {
        examId:       examMap[sub.examKey].$id!,
        userId:       stud.$id!,
        studentName:  stud.name,
        studentEmail: stud.email,
        studentId:    stud.studentId,
        answers:      JSON.stringify(answersObj), // ← now matches string attribute
        score:        sub.score,
        submittedAt:  sub.submittedAt,
      },
      stud.$id!
    )
  }

  console.log('🎉  Database seeded successfully')
})().catch(err => {
  console.error('❌ Seeder error:', err)
  process.exit(1)
})
