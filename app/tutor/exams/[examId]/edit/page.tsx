"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Trash2 } from "lucide-react"
import { fetchExamWithQuestions, editExam } from "@/lib/exam-service"
import { Question } from "@/lib/appwrite"

interface LocalQuestion {
  $id?: string // For updates to existing questions
  text: string
  type: "multiple-choice" | "text"
  options?: string[]
  correctAnswer?: string
  examId?: string // Will be set during submission
  order?: number // Will be set during submission
}

export default function EditExam() {
  const router = useRouter()
  const { examId } = useParams() as { examId: string }
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState("10")
  const [questions, setQuestions] = useState<LocalQuestion[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadExam() {
      try {
        const examWithQuestions = await fetchExamWithQuestions(examId)
        setTitle(examWithQuestions.title)
        setDuration(String(examWithQuestions.duration))
        setQuestions(
          examWithQuestions.questions.map((q) => ({
            $id: q.$id,
            text: q.text,
            type: q.type,
            options: q.options ?? (q.type === "multiple-choice" ? ["", "", "", ""] : undefined),
            correctAnswer: q.correctAnswer,
          }))
        )
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load exam data",
          variant: "destructive",
        })
        router.push("/tutor/dashboard")
      } finally {
        setLoading(false)
      }
    }
    loadExam()
  }, [examId, router, toast])

  // Handlers (same as CreateExam)

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = [...questions]
    if (field === "type") {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        type: value as "multiple-choice" | "text",
        options: value === "multiple-choice" ? ["", "", "", ""] : undefined,
        correctAnswer: value === "multiple-choice" ? "" : undefined,
      }
    } else {
      // @ts-ignore
      updatedQuestions[index][field] = value
    }
    setQuestions(updatedQuestions)
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value
    }
    setQuestions(updatedQuestions)
  }

  const handleCorrectAnswerChange = (questionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].correctAnswer = value
    setQuestions(updatedQuestions)
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
      },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions]
      updatedQuestions.splice(index, 1)
      setQuestions(updatedQuestions)
    } else {
      toast({
        title: "Cannot remove",
        description: "An exam must have at least one question",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validate form
  if (!title) {
    toast({
      title: "Missing title",
      description: "Please provide a title for the exam",
      variant: "destructive",
    })
    return
  }

  if (Number.parseInt(duration) <= 0) {
    toast({
      title: "Invalid duration",
      description: "Duration must be a positive number",
      variant: "destructive",
    })
    return
  }

  // Validate questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!q.text) {
      toast({
        title: "Incomplete question",
        description: `Question ${i + 1} is missing text`,
        variant: "destructive",
      })
      return
    }
    if (q.type === "multiple-choice") {
      if (!q.options?.every((opt) => opt.trim())) {
        toast({
          title: "Incomplete options",
          description: `Question ${i + 1} has empty options`,
          variant: "destructive",
        })
        return
      }
      if (!q.correctAnswer) {
        toast({
          title: "Missing correct answer",
          description: `Question ${i + 1} is missing the correct answer`,
          variant: "destructive",
        })
        return
      }
    }
  }

  setIsSubmitting(true)
  try {
    // Get tutor info
    const tutorInfo = JSON.parse(sessionStorage.getItem("user") || "{}")

    if (!tutorInfo || !tutorInfo.id) {
      throw new Error("Tutor information not found")
    }

    // Map LocalQuestions to the correct structure
    const questionsToSubmit: (Question & { examId: string, order: number })[] = questions.map((q, idx) => ({
      ...q,
      examId: examId, // Attach the examId
      order: idx, // Set the order
    }))

    // Create exam data
    const examData = {
      title,
      duration: Number.parseInt(duration),
      createdBy: tutorInfo.id,
      questions: questionsToSubmit,
    }

    await editExam(examId, examData)

    toast({
      title: "Exam Updated",
      description: "Your exam has been updated successfully",
    })

    router.push("/tutor/dashboard")
  } catch (error) {
    console.error("Error updating exam:", error)
    toast({
      title: "Error",
      description: "Failed to update exam. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}


  if (loading) {
    return <div className="container flex items-center justify-center min-h-screen">Loading exam data...</div>
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Exam</h1>
        <Button variant="outline" onClick={() => router.push("/tutor/dashboard")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter exam title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mb-4">Questions</h2>

        {questions.map((question, index) => (
          <Card key={question.$id || index} className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Question {index + 1}</CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={() => removeQuestion(index)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`question-${index}`}>Question Text</Label>
                <Textarea
                  id={`question-${index}`}
                  value={question.text}
                  onChange={(e) => handleQuestionChange(index, "text", e.target.value)}
                  placeholder="Enter your question"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`question-type-${index}`}>Question Type</Label>
                <Select value={question.type} onValueChange={(value) => handleQuestionChange(index, "type", value)}>
                  <SelectTrigger id={`question-type-${index}`}>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="text">Text Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {question.type === "multiple-choice" && (
                <>
                  <div className="space-y-4">
                    <Label>Options</Label>
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`correct-answer-${index}`}>Correct Answer</Label>
                    <Select
                      value={question.correctAnswer || ""}
                      onValueChange={(value) => handleCorrectAnswerChange(index, value)}
                    >
                      <SelectTrigger id={`correct-answer-${index}`}>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options?.map(
                          (option, optIndex) =>
                            option && (
                              <SelectItem key={optIndex} value={option}>
                                {option}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addQuestion} className="mb-8 w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Question
        </Button>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Updating..." : "Update Exam"}
          </Button>
        </div>
      </form>
    </div>
  )
}
