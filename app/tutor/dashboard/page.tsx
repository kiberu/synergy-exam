"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { PlusCircle, BarChart, User } from "lucide-react"
import { fetchExams, getExamSubmissions } from "@/lib/exam-service"
import type { Exam, Submission, Question } from "@/lib/appwrite"
import { listDocuments, COLLECTIONS } from "@/lib/appwrite"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default function TutorDashboard() {
  const [exams, setExams] = useState<Exam[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [questionCountMap, setQuestionCountMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout } = useAuth()

  useEffect(() => {
    async function loadData() {
      try {
        // 1) Fetch exams
        const examsData = await fetchExams()
        setExams(examsData)

        // 2) Fetch all questions
        const { documents } = await listDocuments(COLLECTIONS.QUESTIONS)
        const questions = documents.map(doc => ({
          examId: doc.examId,
          text: doc.text,
          type: doc.type,
          order: doc.order,
          ...doc,
        })) as Question[]

        // 3) Build map: examId → count
        const counts: Record<string, number> = {}
        questions.forEach(q => {
          counts[q.examId] = (counts[q.examId] || 0) + 1
        })
        setQuestionCountMap(counts)

        // 4) Fetch submissions per exam
        const allSubs: Submission[] = []
        for (const exam of examsData) {
          if (!exam.$id) continue
          const examSubs = await getExamSubmissions(exam.$id)
          examSubs.forEach(sub => {
            // attach examTitle for display
            ;(sub as any).examTitle = exam.title
            allSubs.push(sub)
          })
        }
        setSubmissions(allSubs)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  // derive unique students
  const uniqueStudents = submissions.reduce(
    (acc, submission) => {
      if (!acc.some(s => s.studentId === submission.studentId)) {
        acc.push({
          studentId: submission.studentId,
          studentName: submission.studentName,
          studentEmail: submission.studentEmail,
          submissionCount: submissions.filter(s => s.studentId === submission.studentId).length,
          averageScore:
            submissions.filter(s => s.studentId === submission.studentId).reduce((sum, s) => sum + (s.score || 0), 0) /
            submissions.filter(s => s.studentId === submission.studentId).length,
        })
      }
      return acc
    },
    [] as {
      studentId: string
      studentName: string
      studentEmail: string
      submissionCount: number
      averageScore: number
    }[]
  )

  return (
    <ProtectedRoute allowedRoles={["tutor"]}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tutor Dashboard</h1>
          <Button onClick={logout}>Logout</Button>
        </div>

        <Tabs defaultValue="exams">
          <TabsList className="mb-6">
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Exams</h2>
              <Link href="/tutor/exams/create" passHref>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Exam
                </Button>
              </Link>
            </div>

            {exams.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    You haven't created any exams yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {exams.map(exam => (
                  <Card key={exam.$id}>
                    <CardHeader>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>
                        Created on {formatDate(exam.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{exam.duration} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Questions:</span>
                          <span>{questionCountMap[exam.$id!] ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submissions:</span>
                          <span>
                            {submissions.filter(s => s.examId === exam.$id).length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/tutor/exams/${exam.$id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() =>
                          router.push(`/tutor/exams/${exam.$id}/analytics`)
                        }
                      >
                        <BarChart className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions">
            <h2 className="text-xl font-semibold mb-6">Recent Submissions</h2>
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No submissions received yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">Student</th>
                      <th className="py-3 px-4 text-left">Exam</th>
                      <th className="py-3 px-4 text-left">Submitted</th>
                      <th className="py-3 px-4 text-left">Score</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(submission => (
                      <tr key={submission.$id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {submission.studentName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {submission.studentId}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {(submission as any).examTitle || submission.examId}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(submission.submittedAt)}
                        </td>
                        <td className="py-3 px-4">
                          {submission.score !== undefined
                            ? `${submission.score}%`
                            : "Not graded"}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/tutor/submissions/${submission.$id}`)
                            }
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students">
            <h2 className="text-xl font-semibold mb-6">Students</h2>
            {uniqueStudents.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No students have taken exams yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {uniqueStudents.map(student => (
                  <Card key={student.studentId}>
                    <CardHeader>
                      <CardTitle>{student.studentName}</CardTitle>
                      <CardDescription>ID: {student.studentId}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{student.studentEmail || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Exams Taken:
                          </span>
                          <span>{student.submissionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Average Score:
                          </span>
                          <span>{student.averageScore.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() =>
                          router.push(`/tutor/students/${student.studentId}`)
                        }
                      >
                        <User className="mr-2 h-4 w-4" />
                        View Performance
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard exams={exams} submissions={submissions} />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
