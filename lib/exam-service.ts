import {
  COLLECTIONS,
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  type Exam,
  type Question,
  type Submission,
} from "./appwrite"
import { Query } from "appwrite"

// Fetch all exams
export async function fetchExams() {
  try {
    const response = await listDocuments(COLLECTIONS.EXAMS, [Query.orderDesc("createdAt")])

    return response.documents as unknown as Exam[]
  } catch (error) {
    console.error("Error fetching exams:", error)
    throw error
  }
}

// Fetch a specific exam with its questions
export async function fetchExamWithQuestions(examId: string) {
  try {
    // Get the exam
    const exam = (await getDocument(COLLECTIONS.EXAMS, examId)) as unknown as Exam

    // Get the questions for this exam
    const questionsResponse = await listDocuments(COLLECTIONS.QUESTIONS, [
      Query.equal("examId", examId),
      Query.orderAsc("order"),
    ])

    const questions = questionsResponse.documents as unknown as Question[]

    return {
      ...exam,
      questions,
    }
  } catch (error) {
    console.error("Error fetching exam with questions:", error)
    throw error
  }
}

// Create a new exam with questions
export async function createExam(examData: {
  title: string
  duration: number
  createdBy: string
  questions: Omit<Question, "examId" | "$id" | "order">[]
}) {
  try {
    // Create the exam
    const exam = (await createDocument(
      COLLECTIONS.EXAMS,
      {
        title: examData.title,
        duration: examData.duration,
        createdBy: examData.createdBy,
        createdAt: new Date().toISOString(),
      },
      examData.createdBy,
    )) as unknown as Exam

    // Create the questions
    const questions = await Promise.all(
      examData.questions.map(async (question, index) => {
        return await createDocument(COLLECTIONS.QUESTIONS, {
          ...question,
          examId: exam.$id,
          order: index,
        })
      }),
    )

    return {
      ...exam,
      questions,
    }
  } catch (error) {
    console.error("Error creating exam:", error)
    throw error
  }
}

// Submit exam answers
export async function submitExamAnswers(submissionData: {
  examId: string
  userId: string
  studentName: string
  studentEmail: string
  studentId: string
  answers: Record<string, string>
}) {
  try {
    // Create the submission
    const submission = await createDocument(
      COLLECTIONS.SUBMISSIONS,
      {
        ...submissionData,
        submittedAt: new Date().toISOString(),
      },
      submissionData.userId,
    )

    return submission
  } catch (error) {
    console.error("Error submitting exam answers:", error)
    throw error
  }
}

// Get submissions for an exam
export async function getExamSubmissions(examId: string) {
  try {
    const response = await listDocuments(COLLECTIONS.SUBMISSIONS, [
      Query.equal("examId", examId),
      Query.orderDesc("submittedAt"),
    ])

    return response.documents as unknown as Submission[]
  } catch (error) {
    console.error("Error fetching exam submissions:", error)
    throw error
  }
}

// Get submissions by a student
export async function getStudentSubmissions(studentId: string) {
  try {
    const response = await listDocuments(COLLECTIONS.SUBMISSIONS, [
      Query.equal("studentId", studentId),
      Query.orderDesc("submittedAt"),
    ])

    return response.documents as unknown as Submission[]
  } catch (error) {
    console.error("Error fetching student submissions:", error)
    throw error
  }
}

// Grade a submission
export async function gradeSubmission(submissionId: string, score: number) {
  try {
    const updatedSubmission = await updateDocument(COLLECTIONS.SUBMISSIONS, submissionId, { score })

    return updatedSubmission
  } catch (error) {
    console.error("Error grading submission:", error)
    throw error
  }
}
