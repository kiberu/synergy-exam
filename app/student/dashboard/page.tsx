"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { fetchExams, getStudentSubmissions } from "@/lib/exam-service"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import type { Exam, Submission } from "@/lib/appwrite"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { format } from "date-fns"

export default function StudentDashboard() {
  const [exams, setExams] = useState<Exam[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout } = useAuth()

  useEffect(() => {
    // Fetch student data
    const loadData = async () => {
      try {
        // Get student info from session storage
        const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "{}")

        if (!studentInfo || !studentInfo.studentId) {
          router.push("/student/login")
          return
        }

        // Check if Appwrite is configured
        if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
          // Fallback for when Appwrite is not configured
          console.warn("Appwrite not configured, using mock data")

          // Use mock data
          const mockExams: Exam[] = [
            {
              $id: "exam1",
              id: "exam1",
              title: "Mathematics Midterm",
              duration: 10,
              createdBy: "demo-tutor",
              createdAt: new Date().toISOString(),
              questionCount: 5,
            },
            {
              $id: "exam2",
              id: "exam2",
              title: "Physics Quiz",
              duration: 15,
              createdBy: "demo-tutor",
              createdAt: new Date().toISOString(),
              questionCount: 8,
            },
            {
              $id: "exam3",
              id: "exam3",
              title: "Programming Fundamentals",
              duration: 20,
              createdBy: "demo-tutor",
              createdAt: new Date().toISOString(),
              questionCount: 10,
            },
          ]

          const mockSubmissions: Submission[] = [
            {
              $id: "sub1",
              id: "sub1",
              examId: "exam1",
              examTitle: "Mathematics Midterm",
              userId: studentInfo.id,
              studentName: studentInfo.fullName,
              studentEmail: studentInfo.email || "",
              studentId: studentInfo.studentId,
              answers: { q1: "4", q2: "3.14" },
              score: 85,
              submittedAt: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
            },
            {
              $id: "sub3",
              id: "sub3",
              examId: "exam2",
              examTitle: "Physics Quiz",
              userId: studentInfo.id,
              studentName: studentInfo.fullName,
              studentEmail: studentInfo.email || "",
              studentId: studentInfo.studentId,
              answers: { q1: "Newton", q2: "KE = ½mv²" },
              score: 75,
              submittedAt: new Date(Date.now() - 20 * 86400000).toISOString(), // 20 days ago
            },
          ]

          setExams(mockExams)
          setSubmissions(mockSubmissions)
          setLoading(false)
          return
        }

        // Fetch available exams
        const examsData = await fetchExams()
        setExams(examsData)

        // Fetch student's submissions
        const submissionsData = await getStudentSubmissions(studentInfo.studentId)
        setSubmissions(submissionsData)
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
  }, [router, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  // Get student info
  const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "{}")

  // Sort submissions by date
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  )

  // Prepare data for the performance chart
  const performanceData = sortedSubmissions.map((submission) => ({
    date: submission.submittedAt,
    exam: submission.examTitle,
    score: submission.score || 0,
  }))

  // Calculate average score
  const averageScore =
    submissions.length > 0 ? submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / submissions.length : 0

  // Calculate highest score
  const highestScore = submissions.length > 0 ? Math.max(...submissions.map((sub) => sub.score || 0)) : 0

  // Get available exams (exams that the student hasn't taken yet)
  const takenExamIds = new Set(submissions.map((sub) => sub.examId))
  const availableExams = exams.filter((exam) => !takenExamIds.has(exam.$id!))

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {studentInfo.fullName} • Student ID: {studentInfo.studentId}
            </p>
          </div>
          <Button onClick={() => router.push("/logout")}>Logout</Button>
        </div>

        {submissions.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{highestScore}%</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Performance</CardTitle>
                <CardDescription>Score progression across different exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      score: {
                        label: "Score (%)",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tickFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                                      <span className="font-bold text-muted-foreground">
                                        {format(new Date(data.date), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Score</span>
                                      <span className="font-bold">{data.score}%</span>
                                    </div>
                                    <div className="flex flex-col col-span-2">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Exam</span>
                                      <span className="font-bold">{data.exam}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Score (%)"
                          stroke="var(--color-score)"
                          strokeWidth={2}
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Exam History</CardTitle>
                <CardDescription>All exams you have taken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">Exam</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSubmissions.map((submission) => (
                        <tr key={submission.$id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{submission.examTitle}</td>
                          <td className="py-3 px-4">{formatDate(submission.submittedAt)}</td>
                          <td className="py-3 px-4">
                            <div
                              className={`font-medium ${
                                (submission.score || 0) >= 80
                                  ? "text-green-600"
                                  : (submission.score || 0) >= 60
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }`}
                            >
                              {submission.score !== undefined ? `${submission.score}%` : "Not graded"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">You haven't taken any exams yet.</p>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-semibold mb-4">Available Exams</h2>
        {availableExams.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No exams are currently available.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableExams.map((exam) => (
              <Card key={exam.$id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>
                    Duration: {exam.duration} minutes • {exam.questionCount} questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push(`/student/exam/${exam.$id}`)} className="w-full">
                    Start Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
