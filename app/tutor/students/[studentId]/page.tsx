"use client"

import React, { useEffect, useState } from "react"
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
import type { Submission } from "@/lib/appwrite"
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

type SubmissionWithTitle = Submission & { examTitle: string }

export default function StudentPerformancePage({
  params,
}: {
  params: { studentId: string }
}) {
  const [submissions, setSubmissions] = useState<SubmissionWithTitle[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function loadData() {
      try {
        // 1️⃣ Fetch this student's submissions
        const subs = await getStudentSubmissions(params.studentId)

        // 2️⃣ Fetch ALL exams once, build a map examId → title
        const exams = await fetchExams()
        const titleMap: Record<string, string> = exams.reduce(
          (acc, exam) => {
            if (exam.$id) acc[exam.$id] = exam.title
            return acc
          },
          {} as Record<string, string>
        )

        // 3️⃣ Attach the title to each submission
        const subsWithTitle: SubmissionWithTitle[] = subs.map((sub) => ({
          ...sub,
          examTitle: titleMap[sub.examId] ?? "Unknown Exam",
        }))

        setSubmissions(subsWithTitle)

        // 4️⃣ Derive student name for the header
        if (subsWithTitle.length > 0) {
          setStudentName(subsWithTitle[0].studentName)
        }
      } catch (error) {
        console.error("Error loading student performance:", error)
        toast({
          title: "Error",
          description:
            "Failed to load student performance data. Please try again.",
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
          <Button
            variant="outline"
            onClick={() => router.push("/tutor/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No submissions found for this student.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort chronologically
  const sorted = [...submissions].sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )

  // Chart data
  const performanceData = sorted.map((sub) => ({
    date: sub.submittedAt,
    exam: sub.examTitle,
    score: sub.score ?? 0,
  }))

  // Stats
  const avg =
    submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
    submissions.length
  const high = Math.max(...submissions.map((s) => s.score ?? 0))
  const low = Math.min(...submissions.map((s) => s.score ?? 0))

  return (
    <ProtectedRoute allowedRoles={["tutor"]}>
      <div className="container py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {studentName}’s Performance
            </h1>
            <p className="text-muted-foreground">
              Student ID: {params.studentId} • {submissions.length} exams taken
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/tutor/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[["Average Score", avg], ["Highest Score", high], ["Lowest Score", low]].map(
            ([label, val]) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Number(val).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Line chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Score progression across different exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ChartContainer
                config={{
                  score: { label: "Score (%)", color: "hsl(var(--chart-1))" },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
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

        {/* Exam history table */}
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
                  {sorted.map((sub) => (
                    <tr
                      key={sub.$id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">{sub.examTitle}</td>
                      <td className="py-3 px-4">
                        {new Date(sub.submittedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`font-medium ${
                            (sub.score || 0) >= 80
                              ? "text-green-600"
                              : (sub.score || 0) >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {sub.score !== undefined
                            ? `${sub.score}%`
                            : "Not graded"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/tutor/submissions/${sub.$id}`)
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
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
