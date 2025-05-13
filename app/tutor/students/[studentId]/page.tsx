"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getStudentSubmissions } from "@/lib/exam-service"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import type { Submission } from "@/lib/appwrite"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { format } from "date-fns"

export default function StudentPerformancePage({ params }: { params: { studentId: string } }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if Appwrite is configured
        if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
          // Fallback for when Appwrite is not configured
          console.warn("Appwrite not configured, using mock data")

          // Mock submissions for this student
          const mockSubmissions: Submission[] = [
            {
              $id: "sub1",
              id: "sub1",
              examId: "exam1",
              examTitle: "Mathematics Midterm",
              userId: "student1",
              studentName: "John Doe",
              studentEmail: "john@example.com",
              studentId: params.studentId,
              answers: { q1: "4", q2: "3.14" },
              score: 85,
              submittedAt: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
            },
            {
              $id: "sub3",
              id: "sub3",
              examId: "exam2",
              examTitle: "Physics Quiz",
              userId: "student1",
              studentName: "John Doe",
              studentEmail: "john@example.com",
              studentId: params.studentId,
              answers: { q1: "Newton", q2: "KE = ½mv²" },
              score: 75,
              submittedAt: new Date(Date.now() - 20 * 86400000).toISOString(), // 20 days ago
            },
            {
              $id: "sub4",
              id: "sub4",
              examId: "exam3",
              examTitle: "Programming Fundamentals",
              userId: "student1",
              studentName: "John Doe",
              studentEmail: "john@example.com",
              studentId: params.studentId,
              answers: { q1: "Hyper Text Markup Language", q2: "Character" },
              score: 90,
              submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
            },
          ]

          setSubmissions(mockSubmissions)
          setStudentName(mockSubmissions[0].studentName)
          setLoading(false)
          return
        }

        // Fetch submissions for this student
        const submissionsData = await getStudentSubmissions(params.studentId)
        setSubmissions(submissionsData)

        if (submissionsData.length > 0) {
          setStudentName(submissionsData[0].studentName)
        }
      } catch (error) {
        console.error("Error loading student performance:", error)
        toast({
          title: "Error",
          description: "Failed to load student performance data. Please try again.",
          variant: "destructive",
        })
        router.push("/tutor/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.studentId, router, toast])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading student performance data...</p>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Performance</h1>
          <Button variant="outline" onClick={() => router.push("/tutor/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No submissions found for this student.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
  const averageScore = submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / submissions.length

  // Calculate highest and lowest scores
  const highestScore = Math.max(...submissions.map((sub) => sub.score || 0))
  const lowestScore = Math.min(...submissions.map((sub) => sub.score || 0))

  return (
    <ProtectedRoute allowedRoles={["tutor"]}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{studentName}'s Performance</h1>
            <p className="text-muted-foreground">
              Student ID: {params.studentId} • {submissions.length} exams taken
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/tutor/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowestScore}%</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Score progression across different exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
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

        <Card>
          <CardHeader>
            <CardTitle>Exam History</CardTitle>
            <CardDescription>All exams taken by this student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Exam</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Score</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubmissions.map((submission) => (
                    <tr key={submission.$id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{submission.examTitle}</td>
                      <td className="py-3 px-4">
                        {new Date(submission.submittedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
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
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/tutor/submissions/${submission.$id}`)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
