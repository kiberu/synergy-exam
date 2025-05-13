"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock } from "lucide-react"
import { fetchExamWithQuestions, submitExamAnswers } from "@/lib/exam-service"
import type { Question } from "@/lib/appwrite"

interface ExamData {
  $id?: string
  id: string
  title: string
  duration: number
  questions: Question[]
}

export default function ExamPage({ params }: { params: { examId: string } }) {
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examCompleted, setExamCompleted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if student is logged in
    const studentInfo = sessionStorage.getItem("studentInfo")
    if (!studentInfo) {
      router.push("/student/login")
      return
    }

    // Fetch exam data
    const loadExam = async () => {
      try {
        // Check if Appwrite is configured
        if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
          // Fallback for when Appwrite is not configured
          console.warn("Appwrite not configured, using mock data")

          // Use mock data based on exam ID
          const mockExam: ExamData = {
            $id: params.examId,
            id: params.examId,
            title:
              params.examId === "exam1"
                ? "Mathematics Midterm"
                : params.examId === "exam2"
                  ? "Physics Quiz"
                  : "Programming Fundamentals",
            duration: params.examId === "exam1" ? 10 : params.examId === "exam2" ? 15 : 20,
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
                text: "What is the capital of France?",
                type: "multiple-choice",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correctAnswer: "Paris",
                order: 1,
              },
              {
                $id: "q3",
                id: "q3",
                examId: params.examId,
                text: "Explain the concept of variables in programming.",
                type: "text",
                order: 2,
              },
              {
                $id: "q4",
                id: "q4",
                examId: params.examId,
                text: "What is the value of π (pi) to 2 decimal places?",
                type: "multiple-choice",
                options: ["3.14", "3.15", "3.16", "3.17"],
                correctAnswer: "3.14",
                order: 3,
              },
              {
                $id: "q5",
                id: "q5",
                examId: params.examId,
                text: "Describe Newton's First Law of Motion.",
                type: "text",
                order: 4,
              },
            ],
          }

          setExamData(mockExam)
          // Set timer based on exam duration (convert minutes to seconds)
          setTimeLeft(mockExam.duration * 60)
          return
        }

        const examWithQuestions = await fetchExamWithQuestions(params.examId)
        setExamData(examWithQuestions)
        // Set timer based on exam duration (convert minutes to seconds)
        setTimeLeft(examWithQuestions.duration * 60)
      } catch (error) {
        console.error("Error loading exam:", error)
        toast({
          title: "Error",
          description: "Failed to load exam data. Please try again.",
          variant: "destructive",
        })
        router.push("/student/exams")
      }
    }

    loadExam()
  }, [params.examId, router, toast])

  // Timer effect
  useEffect(() => {
    if (!examData || timeLeft <= 0 || examCompleted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examData, timeLeft, examCompleted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleNext = () => {
    if (examData && currentQuestion < examData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    if (!examData) return

    setIsSubmitting(true)

    try {
      // Get student info
      const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "{}")

      // Check if Appwrite is configured
      if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
        // Fallback for when Appwrite is not configured
        console.warn("Appwrite not configured, using mock submission")

        // Log the submission data
        console.log("Mock submission:", {
          examId: examData.$id,
          userId: studentInfo.id || "anonymous",
          studentName: studentInfo.fullName,
          studentEmail: studentInfo.email || "",
          studentId: studentInfo.studentId,
          answers: answers,
        })

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setExamCompleted(true)
        toast({
          title: "Exam Submitted",
          description: "Your answers have been recorded successfully.",
        })
        return
      }

      // Prepare data for submission
      const submissionData = {
        examId: examData.$id!,
        userId: studentInfo.id || "anonymous",
        studentName: studentInfo.fullName,
        studentEmail: studentInfo.email || "",
        studentId: studentInfo.studentId,
        answers: answers,
      }

      // Submit to Appwrite
      await submitExamAnswers(submissionData)

      setExamCompleted(true)
      toast({
        title: "Exam Submitted",
        description: "Your answers have been recorded successfully.",
      })
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Submission Error",
        description: "Failed to submit your answers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!examData) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading exam...</p>
      </div>
    )
  }

  if (examCompleted) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Exam Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">Thank you for completing the {examData.title}.</p>
            <p className="mb-6">Your answers have been submitted successfully.</p>
            <Button onClick={() => router.push("/student/exams")} className="w-full">
              Return to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestionData = examData.questions[currentQuestion]

  return (
    <div className="container py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{examData.title}</h1>
        <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
          <Clock className="h-5 w-5" />
          <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-500" : ""}`}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {timeLeft < 60 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Time is running out!</AlertTitle>
          <AlertDescription>
            You have less than a minute remaining. Your exam will be automatically submitted when the timer reaches
            zero.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Question {currentQuestion + 1} of {examData.questions.length}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentQuestionData.type === "multiple-choice" ? "Multiple Choice" : "Text Answer"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">{currentQuestionData.text}</h3>

            {currentQuestionData.type === "multiple-choice" && currentQuestionData.options ? (
              <RadioGroup
                value={answers[currentQuestionData.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestionData.id, value)}
                className="space-y-3"
              >
                {currentQuestionData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers[currentQuestionData.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[150px]"
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Previous
            </Button>
          </div>
          <div className="flex gap-2">
            {currentQuestion < examData.questions.length - 1 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} variant="default">
                {isSubmitting ? "Submitting..." : "Submit Exam"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <div className="mt-6 flex justify-center">
        <div className="flex flex-wrap gap-2 max-w-md">
          {examData.questions.map((_, index) => (
            <Button
              key={index}
              variant={
                index === currentQuestion ? "default" : answers[examData.questions[index].id] ? "outline" : "ghost"
              }
              size="sm"
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 ${answers[examData.questions[index].id] ? "border-green-500" : ""}`}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
