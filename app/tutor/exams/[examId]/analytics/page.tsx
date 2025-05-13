"use client"

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
import { fetchExamWithQuestions, getExamSubmissions } from "@/lib/exam-service"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import type { Exam, Question, Submission } from "@/lib/appwrite"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

type SubmissionWithTitle = Submission & { examTitle: string }

export default function ExamAnalyticsPage({
  params,
}: {
  params: { examId: string }
}) {
  const [exam, setExam] = useState<(Exam & { questions: Question[] }) | null>(
    null
  )
  const [submissions, setSubmissions] = useState<SubmissionWithTitle[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function loadData() {
      try {
        // 1) Fetch exam + questions
        const examData = await fetchExamWithQuestions(params.examId)
        setExam(examData)

        // 2) Fetch submissions and tag with exam title
        const subs = await getExamSubmissions(params.examId)
        const subsWithTitle: SubmissionWithTitle[] = subs.map((s) => ({
          ...s,
          examTitle: examData.title,
        }))
        setSubmissions(subsWithTitle)
      } catch (error) {
        console.error("Error loading exam analytics:", error)
        toast({
          title: "Error",
          description: "Failed to load exam analytics. Please try again.",
          variant: "destructive",
        })
        router.push("/tutor/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.examId, router, toast])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading exam analytics…</p>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Exam not found</p>
      </div>
    )
  }

  // — Overall Stats —
  const scores = submissions.map((s) => s.score ?? 0)
  const averageScore =
    scores.reduce((acc, v) => acc + v, 0) / (scores.length || 1)
  const highestScore = Math.max(...scores, 0)
  const lowestScore = Math.min(...scores, 0)
  const passingRate =
    (submissions.filter((s) => (s.score ?? 0) >= 60).length /
      (submissions.length || 1)) *
    100

  // — Score Distribution Buckets —
  const buckets = [
    { name: "0-20%", min: 0, max: 20, count: 0 },
    { name: "21-40%", min: 21, max: 40, count: 0 },
    { name: "41-60%", min: 41, max: 60, count: 0 },
    { name: "61-80%", min: 61, max: 80, count: 0 },
    { name: "81-100%", min: 81, max: 100, count: 0 },
  ]
  submissions.forEach((s) => {
    const sc = s.score ?? 0
    const bucket = buckets.find((b) => sc >= b.min && sc <= b.max)
    if (bucket) bucket.count++
  })

  // — Question Performance —
  const questionPerformance = exam.questions.map((q) => {
    const qid = q.$id!
    let correct = 0,
      total = 0
    submissions.forEach((s) => {
      const ans = s.answers[qid]
      if (ans !== undefined) {
        total++
        if (q.type === "multiple-choice" && ans === q.correctAnswer) {
          correct++
        }
      }
    })
    const pct = total > 0 ? (correct / total) * 100 : 0
    return {
      text:
        q.text.length > 30 ? q.text.slice(0, 30) + "…" : q.text,
      correctPct: Number(pct.toFixed(1)),
      incorrectPct: Number((100 - pct).toFixed(1)),
    }
  })

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <ProtectedRoute allowedRoles={["tutor"]}>
      <div className="container py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {exam.title} – Analytics
            </h1>
            <p className="text-muted-foreground">
              {submissions.length} submissions •{" "}
              {exam.questions.length} questions • {exam.duration} mins
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/tutor/dashboard")}
          >
            Back
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          {[
            ["Average Score", `${averageScore.toFixed(1)}%`],
            ["Highest Score", `${highestScore}%`],
            ["Lowest Score", `${lowestScore}%`],
            ["Passing Rate", `${passingRate.toFixed(1)}%`],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Distribution Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Count per range</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  count: { label: "Students", color: "hsl(var(--chart-1))" },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buckets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score % Breakdown</CardTitle>
              <CardDescription>Pie chart</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buckets}
                    dataKey="count"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {buckets.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => `${val} students`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Question Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>
              % correct vs incorrect
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ChartContainer
              config={{
                correctPct: {
                  label: "Correct %",
                  color: "hsl(var(--chart-1))",
                },
                incorrectPct: {
                  label: "Incorrect %",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={questionPerformance}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="text"
                    width={150}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="correctPct" stackId="a" />
                  <Bar dataKey="incorrectPct" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Individual Student Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Student Scores</CardTitle>
            <CardDescription>All submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Student</th>
                    <th className="py-2 px-4 text-left">Score</th>
                    <th className="py-2 px-4 text-left">Submitted</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr
                      key={s.$id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-2 px-4">
                        <div className="font-medium">
                          {s.studentName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {s.studentId}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {s.score != null ? `${s.score}%` : "–"}
                      </td>
                      <td className="py-2 px-4">
                        {new Date(s.submittedAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/tutor/submissions/${s.$id}`
                            )
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
