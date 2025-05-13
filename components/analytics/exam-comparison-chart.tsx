"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts"
import type { Exam, Submission } from "@/lib/appwrite"
import { ChartContainer } from "@/components/ui/chart"

interface ExamComparisonChartProps {
  exams: Exam[]
  submissions: Submission[]
}

export function ExamComparisonChart({ exams, submissions }: ExamComparisonChartProps) {
  // Get the top 3 exams with the most submissions
  const topExams = [...exams]
    .map((exam) => {
      const examSubmissions = submissions.filter((sub) => sub.examId === exam.$id)
      return {
        ...exam,
        submissionCount: examSubmissions.length,
      }
    })
    .sort((a, b) => b.submissionCount - a.submissionCount)
    .slice(0, 3)

  // Calculate metrics for each exam
  const metrics = [
    { name: "Average Score", key: "averageScore" },
    { name: "Completion Rate", key: "completionRate" },
    { name: "Submission Count", key: "submissionCount" },
    { name: "Time Efficiency", key: "timeEfficiency" },
    { name: "Question Difficulty", key: "questionDifficulty" },
  ]

  const chartData = metrics.map((metric) => {
    const data: any = { name: metric.name }

    topExams.forEach((exam) => {
      const examSubmissions = submissions.filter((sub) => sub.examId === exam.$id)

      switch (metric.key) {
        case "averageScore":
          data[exam.title] = Number.parseFloat(
            (examSubmissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / examSubmissions.length || 0).toFixed(1),
          )
          break
        case "completionRate":
          // Assuming completion rate is the percentage of questions answered
          // This is a mock calculation
          data[exam.title] = Number.parseFloat((Math.random() * 30 + 70).toFixed(1))
          break
        case "submissionCount":
          data[exam.title] = examSubmissions.length
          break
        case "timeEfficiency":
          // Mock time efficiency score (higher is better)
          data[exam.title] = Number.parseFloat((Math.random() * 40 + 60).toFixed(1))
          break
        case "questionDifficulty":
          // Mock difficulty score (higher means more difficult)
          data[exam.title] = Number.parseFloat((Math.random() * 50 + 50).toFixed(1))
          break
      }
    })

    return data
  })

  // Create config for the chart
  const config: Record<string, { label: string; color: string }> = {}
  topExams.forEach((exam, index) => {
    config[exam.title] = {
      label: exam.title,
      color: `hsl(var(--chart-${index + 1}))`,
    }
  })

  return (
    <ChartContainer config={config} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={90} data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          {topExams.map((exam) => (
            <Radar
              key={exam.$id}
              name={exam.title}
              dataKey={exam.title}
              stroke={`var(--color-${exam.title.replace(/\s+/g, "-")})`}
              fill={`var(--color-${exam.title.replace(/\s+/g, "-")})`}
              fillOpacity={0.6}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
