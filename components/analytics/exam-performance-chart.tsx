"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import type { Exam, Submission } from "@/lib/appwrite"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ExamPerformanceChartProps {
  exams: Exam[]
  submissions: Submission[]
}

export function ExamPerformanceChart({ exams, submissions }: ExamPerformanceChartProps) {
  // Calculate average score for each exam
  const examPerformanceData = exams.map((exam) => {
    const examSubmissions = submissions.filter((sub) => sub.examId === exam.$id)
    const averageScore = examSubmissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / examSubmissions.length || 0

    return {
      name: exam.title,
      averageScore: Number.parseFloat(averageScore.toFixed(1)),
      submissions: examSubmissions.length,
    }
  })

  return (
    <ChartContainer
      config={{
        averageScore: {
          label: "Average Score (%)",
          color: "hsl(var(--chart-1))",
        },
        submissions: {
          label: "Number of Submissions",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={examPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
          <YAxis yAxisId="left" orientation="left" stroke="var(--color-averageScore)" />
          <YAxis yAxisId="right" orientation="right" stroke="var(--color-submissions)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="averageScore"
            name="Average Score (%)"
            fill="var(--color-averageScore)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="submissions"
            name="Number of Submissions"
            fill="var(--color-submissions)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
