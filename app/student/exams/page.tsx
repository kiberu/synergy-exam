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
import { fetchExams } from "@/lib/exam-service"
import { listDocuments, COLLECTIONS } from "@/lib/appwrite"
import type { Exam } from "@/lib/appwrite"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

export default function ExamsList() {
  const [exams, setExams] = useState<Exam[]>([])
  const [questionCountMap, setQuestionCountMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // 1️⃣ Fetch all exams
        const examsData = await fetchExams()
        setExams(examsData)

        // 2️⃣ Fetch all questions once
        const { documents: questions } = await listDocuments(COLLECTIONS.QUESTIONS)

        // 3️⃣ Build examId → count map
        const map: Record<string, number> = {}
        questions.forEach((q) => {
          map[q.examId] = (map[q.examId] || 0) + 1
        })
        setQuestionCountMap(map)
      } catch (error) {
        console.error("Error loading exams:", error)
        toast({
          title: "Error",
          description: "Could not load exams. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const startExam = (examId: string) => {
    router.push(`/student/exam/${examId}`)
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading available exams…</p>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Available Exams</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.name}</span>
            <Button variant="outline" onClick={() => router.push("/logout")}>
              Logout
            </Button>
          </div>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No exams are currently available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.$id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>
                    Duration: {exam.duration} minutes •{" "}
                    {questionCountMap[exam.$id!] ?? 0} questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => startExam(exam.$id!)}
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
