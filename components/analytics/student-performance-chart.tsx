"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import type { Submission } from "@/lib/appwrite"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface StudentPerformanceChartProps {
  submissions: Submission[]
}

export function StudentPerformanceChart({ submissions }: StudentPerformanceChartProps) {
  // Calculate average score for each student
  const studentScores = submissions.reduce(
    (acc, sub) => {
      if (!acc[sub.studentId]) {
        acc[sub.studentId] = {
          name: sub.studentName,
          scores: [],
          totalScore: 0,
          count: 0,
        }
      }

      if (sub.score !== undefined) {
        acc[sub.studentId].scores.push(sub.score)
        acc[sub.studentId].totalScore += sub.score
        acc[sub.studentId].count += 1
      }

      return acc
    },
    {} as Record<string, { name: string; scores: number[]; totalScore: number; count: number }>,
  )

  // Calculate average score for each student
  const studentPerformanceData = Object.values(studentScores)
    .map((student) => ({
      name: student.name,
      averageScore: Number.parseFloat((student.totalScore / student.count).toFixed(1)),
      examsTaken: student.count,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10) // Top 10 students

  return (
    <ChartContainer
      config={{
        averageScore: {
          label: "Average Score (%)",
          color: "hsl(var(--chart-1))",
        },
        examsTaken: {
          label: "Exams Taken",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={studentPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
          <YAxis yAxisId="left" orientation="left" stroke="var(--color-averageScore)" />
          <YAxis yAxisId="right" orientation="right" stroke="var(--color-examsTaken)" />
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
            dataKey="examsTaken"
            name="Exams Taken"
            fill="var(--color-examsTaken)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
