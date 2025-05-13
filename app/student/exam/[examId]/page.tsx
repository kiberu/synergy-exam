'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock } from "lucide-react"
import {
  fetchExamWithQuestions,
  submitExamAnswers,
} from "@/lib/exam-service"
import type { Exam, Question } from "@/lib/appwrite"
import { format } from "date-fns"

type ExamWithQuestions = Exam & { questions: Question[] }

export default function ExamPage({
  params,
}: {
  params: { examId: string }
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [examData, setExamData] = useState<ExamWithQuestions | null>(null)
  const [answers, setAnswers] = useState<Record<string,string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examCompleted, setExamCompleted] = useState(false)

  // load the exam from Appwrite
  useEffect(() => {
    const studentInfo = sessionStorage.getItem("studentInfo")
    if (!studentInfo) {
      router.push("/student/login")
      return
    }

    fetchExamWithQuestions(params.examId)
      .then((exam) => {
        setExamData(exam)
        setTimeLeft(exam.duration * 60)
      })
      .catch((err) => {
        console.error("Error loading exam:", err)
        toast({
          title: "Load error",
          description: "Could not load the exam. Please try again.",
          variant: "destructive",
        })
        router.push("/student/exams")
      })
  }, [params.examId, router, toast])

  // countdown
  useEffect(() => {
    if (!examData || timeLeft <= 0 || examCompleted) return
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [examData, timeLeft, examCompleted])

  const formatTime = (secs: number) =>
    `${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`

  const handleAnswerChange = (qId: string, val: string) =>
    setAnswers((a) => ({ ...a, [qId]: val }))

  const handleNext = () =>
    examData && currentQuestion < examData.questions.length - 1 &&
      setCurrentQuestion((i) => i + 1)

  const handlePrevious = () =>
    currentQuestion > 0 && setCurrentQuestion((i) => i - 1)

  const handleSubmit = async () => {
    if (!examData) return
    setIsSubmitting(true)
    try {
      const studentInfo = JSON.parse(
        sessionStorage.getItem("studentInfo")!
      )
      await submitExamAnswers({
        examId:      examData.$id!,
        userId:      studentInfo.id,
        studentName: studentInfo.fullName,
        studentEmail:studentInfo.email,
        studentId:   studentInfo.studentId,
        answers,
      })
      setExamCompleted(true)
      toast({
        title: "Submitted",
        description: "Your exam has been submitted.",
      })
    } catch (err) {
      console.error("Submit error:", err)
      toast({
        title: "Submit failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!examData) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading exam…</p>
      </div>
    )
  }

  if (examCompleted) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Exam Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Thanks for completing {examData.title}.</p>
            <Button onClick={() => router.push("/student/exams")}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const q = examData.questions[currentQuestion]

  return (
    <div className="container py-8">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{examData.title}</h1>
        <div className="flex items-center gap-2 bg-muted p-2 rounded">
          <Clock className="h-5 w-5" />
          <span className={timeLeft < 60 ? "text-red-500 font-mono" : "font-mono"}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </header>

      {timeLeft < 60 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="mr-2" />
          <AlertTitle>Almost out of time!</AlertTitle>
          <AlertDescription>
            Your exam will auto-submit at zero.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>
              Q{currentQuestion+1} of {examData.questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {q.type === "multiple-choice" ? "Multiple Choice" : "Free Text"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="mb-4 font-medium">{q.text}</p>

          {q.type === "multiple-choice" && q.options ? (
            <RadioGroup
              value={answers[q.$id!]}
              onValueChange={(v) => handleAnswerChange(q.$id!, v)}
              className="space-y-2"
            >
              {q.options.map((opt) => (
                <div
                  key={opt}
                  className="flex items-center space-x-2 border p-3 rounded"
                >
                  <RadioGroupItem value={opt} id={opt} />
                  <Label htmlFor={opt}>{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={answers[q.$id!] || ""}
              onChange={(e) =>
                handleAnswerChange(q.$id!, e.currentTarget.value)
              }
              className="min-h-[150px]"
            />
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion===0}>
            Previous
          </Button>
          {currentQuestion < examData.questions.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="mt-6 flex justify-center gap-2">
        {examData.questions.map((_, i) => (
          <Button
            key={i}
            variant={i===currentQuestion ? "default" : answers[examData.questions[i].$id!] ? "outline" : "ghost"}
            size="sm"
            onClick={() => setCurrentQuestion(i)}
            className="w-10 h-10"
          >
            {i+1}
          </Button>
        ))}
      </div>
    </div>
  )
}
