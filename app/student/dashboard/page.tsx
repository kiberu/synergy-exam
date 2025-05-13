'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { fetchExams, getStudentSubmissions } from "@/lib/exam-service"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import type { Exam, Submission } from "@/lib/appwrite"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
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
    const loadData = async () => {
      // ensure logged in
      const studentInfo = JSON.parse(
        sessionStorage.getItem("studentInfo") || "{}"
      )
      if (!studentInfo?.studentId) {
        router.push("/student/login")
        return
      }

      try {
        const examsData = await fetchExams()
        setExams(examsData)

        const submissionsData = await getStudentSubmissions(
          studentInfo.studentId
        )
        setSubmissions(submissionsData)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        toast({
          title: "Error",
          description:
            "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, toast])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  const studentInfo = JSON.parse(
    sessionStorage.getItem("studentInfo") || "{}"
  )

  // sort & prepare chart data
  const sorted = [...submissions].sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() -
      new Date(b.submittedAt).getTime()
  )
  const performanceData = sorted.map((s) => ({
    date: s.submittedAt,
    exam:
      exams.find((e) => e.$id === s.examId)?.title ?? "Unknown",
    score: s.score ?? 0,
  }))

  const avg =
    submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
        submissions.length
      : 0
  const high =
    submissions.length > 0
      ? Math.max(...submissions.map((s) => s.score ?? 0))
      : 0

  const taken = new Set(submissions.map((s) => s.examId))
  const available = exams.filter((e) => !taken.has(e.$id!))

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Student Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome, {studentInfo.fullName} • Student ID:{" "}
              {studentInfo.studentId}
            </p>
          </div>
          <Button onClick={() => logout()}>Logout</Button>
        </div>

        {submissions.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {avg.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Highest Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {high}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Performance</CardTitle>
                <CardDescription>
                  Score progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      score: { label: "Score (%)" },
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 70,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tickFormatter={(v) =>
                            format(new Date(v), "MMM dd, yyyy")
                          }
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Score (%)"
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
                <CardDescription>
                  All exams you have taken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">
                          Exam
                        </th>
                        <th className="py-3 px-4 text-left">
                          Date
                        </th>
                        <th className="py-3 px-4 text-left">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((s) => {
                        const title =
                          exams.find((e) => e.$id === s.examId)
                            ?.title ?? "Unknown"
                        return (
                          <tr
                            key={s.$id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-3 px-4">
                              {title}
                            </td>
                            <td className="py-3 px-4">
                              {format(
                                new Date(s.submittedAt),
                                "MMM dd, yyyy"
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div
                                className={`font-medium ${
                                  (s.score ?? 0) >= 80
                                    ? "text-green-600"
                                    : (s.score ?? 0) >= 60
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {s.score ?? 0}%
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                You haven't taken any exams yet.
              </p>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-semibold mb-4">
          Available Exams
        </h2>
        {available.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No exams are currently available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {available.map((exam) => (
              <Card key={exam.$id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>
                    Duration: {exam.duration} minutes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() =>
                      router.push(
                        `/student/exam/${exam.$id}`
                      )
                    }
                    className="w-full"
                  >
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
