"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { fetchExams } from "@/lib/exam-service"
import type { Exam } from "@/lib/appwrite"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

export default function ExamsList() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Fetch available exams
    const loadExams = async () => {
      try {
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

          setExams(mockExams)
          setLoading(false)
          return
        }

        const examsData = await fetchExams()
        setExams(examsData)
      } catch (error) {
        console.error("Error fetching exams:", error)
        toast({
          title: "Error",
          description: "Failed to load exams. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [toast])

  const startExam = (examId: string) => {
    router.push(`/student/exam/${examId}`)
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading available exams...</p>
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
              <p className="text-center text-muted-foreground">No exams are currently available.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>
                    Duration: {exam.duration} minutes • {exam.questionCount} questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => startExam(exam.id)} className="w-full">
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
