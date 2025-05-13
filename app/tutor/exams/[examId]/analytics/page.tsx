"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function ExamAnalyticsPage({ params }: { params: { examId: string } }) {
  const [exam, setExam] = useState<(Exam & { questions: Question[] }) | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
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

          // Mock exam data
          const mockExam: Exam & { questions: Question[] } = {
            $id: params.examId,
            id: params.examId,
            title: "Mathematics Midterm",
            duration: 10,
            createdBy: "demo-tutor",
            createdAt: new Date().toISOString(),
            questions: [
              {
                $id: "q1",
                id: "q1",
                examId: params.examId,
                text: "What is 2 + 2?",
                type: "multiple-choice",
                options: ["3", "4", "5", "6"],
                correctAnswer: "4",
                order: 0,
              },
              {
                $id: "q2",
                id: "q2",
                examId: params.examId,
                text: "What is the value of π (pi) to 2 decimal places?",
                type: "multiple-choice",
                options: ["3.14", "3.15", "3.16", "3.17"],
                correctAnswer: "3.14",
                order: 1,
              },
              {
                $id: "q3",
                id: "q3",
                examId: params.examId,
                text: "Solve for x: 2x + 5 = 15",
                type: "multiple-choice",
                options: ["4", "5", "6", "7"],
                correctAnswer: "5",
                order: 2,
              },
            ],
          }

          // Mock submissions
          const mockSubmissions: Submission[] = [
            {
              $id: "sub1",
              id: "sub1",
              examId: params.examId,
              examTitle: "Mathematics Midterm",
              userId: "student1",
              studentName: "John Doe",
              studentEmail: "john@example.com",
              studentId: "S12345",
              answers: { q1: "4", q2: "3.14", q3: "5" },
              score: 100,
              submittedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            },
            {
              $id: "sub2",
              id: "sub2",
              examId: params.examId,
              examTitle: "Mathematics Midterm",
              userId: "student2",
              studentName: "Jane Smith",
              studentEmail: "jane@example.com",
              studentId: "S12346",
              answers: { q1: "4", q2: "3.15", q3: "5" },
              score: 67,
              submittedAt: new Date(Date.now() - 72000000).toISOString(), // 20 hours ago
            },
            {
              $id: "sub3",
              id: "sub3",
              examId: params.examId,
              examTitle: "Mathematics Midterm",
              userId: "student3",
              studentName: "Bob Johnson",
              studentEmail: "bob@example.com",
              studentId: "S12347",
              answers: { q1: "3", q2: "3.14", q3: "4" },
              score: 33,
              submittedAt: new Date(Date.now() - 48000000).toISOString(), // 13 hours ago
            },
          ]

          setExam(mockExam)
          setSubmissions(mockSubmissions)
          setLoading(false)
          return
        }

        // Fetch exam with questions
        const examData = await fetchExamWithQuestions(params.examId)
        setExam(examData)

        // Fetch submissions for this exam
        const submissionsData = await getExamSubmissions(params.examId)
        setSubmissions(submissionsData)
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
        <p>Loading exam analytics...</p>
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

  // Calculate score distribution
  const scoreRanges = [
    { name: "0-20%", range: [0, 20], count: 0 },
    { name: "21-40%", range: [21, 40], count: 0 },
    { name: "41-60%", range: [41, 60], count: 0 },
    { name: "61-80%", range: [61, 80], count: 0 },
    { name: "81-100%", range: [81, 100], count: 0 },
  ]

  submissions.forEach((submission) => {
    if (submission.score !== undefined) {
      const range = scoreRanges.find(
        (range) => submission.score! >= range.range[0] && submission.score! <= range.range[1],
      )
      if (range) {
        range.count += 1
      }
    }
  })

  // Calculate question performance
  const questionPerformance = exam.questions.map((question) => {
    let correctCount = 0
    let totalAnswered = 0

    submissions.forEach((submission) => {
      if (submission.answers[question.id]) {
        totalAnswered += 1
        if (question.type === "multiple-choice" && submission.answers[question.id] === question.correctAnswer) {
          correctCount += 1
        }
      }
    })

    const correctPercentage = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0

    return {
      id: question.id,
      text: question.text.length > 30 ? question.text.substring(0, 30) + "..." : question.text,
      correctPercentage: Number.parseFloat(correctPercentage.toFixed(1)),
      incorrectPercentage: Number.parseFloat((100 - correctPercentage).toFixed(1)),
    }
  })

  // Calculate overall statistics
  const averageScore = submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / submissions.length || 0
  const highestScore = Math.max(...submissions.map((sub) => sub.score || 0))
  const lowestScore = Math.min(...submissions.map((sub) => sub.score || 0))
  const passingRate = (submissions.filter((sub) => (sub.score || 0) >= 60).length / submissions.length) * 100 || 0

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <ProtectedRoute allowedRoles={["tutor"]}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{exam.title} - Analytics</h1>
            <p className="text-muted-foreground">
              {submissions.length} submissions • {exam.questions.length} questions • {exam.duration} minutes
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/tutor/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Passing Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passingRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Number of students in each score range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    count: {
                      label: "Number of Students",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreRanges} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="count" name="Number of Students" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Percentage of students in each score range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreRanges}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {scoreRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => {
                        const total = submissions.length
                        const percent = total > 0 ? ((value as number) / total) * 100 : 0
                        return [`${value} (${percent.toFixed(1)}%)`, "Students"]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>Percentage of correct answers for each question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ChartContainer
                config={{
                  correctPercentage: {
                    label: "Correct Answers (%)",
                    color: "hsl(var(--chart-1))",
                  },
                  incorrectPercentage: {
                    label: "Incorrect Answers (%)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={questionPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="text" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="correctPercentage"
                      name="Correct Answers (%)"
                      stackId="a"
                      fill="var(--color-correctPercentage)"
                    />
                    <Bar
                      dataKey="incorrectPercentage"
                      name="Incorrect Answers (%)"
                      stackId="a"
                      fill="var(--color-incorrectPercentage)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Individual scores for each student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Student</th>
                    <th className="py-3 px-4 text-left">Score</th>
                    <th className="py-3 px-4 text-left">Submitted</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.$id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{submission.studentName}</div>
                          <div className="text-sm text-muted-foreground">ID: {submission.studentId}</div>
                        </div>
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
                        {new Date(submission.submittedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
