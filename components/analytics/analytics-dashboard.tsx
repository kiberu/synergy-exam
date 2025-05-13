"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Exam, Submission } from "@/lib/appwrite"
import { ExamPerformanceChart } from "./exam-performance-chart"
import { StudentPerformanceChart } from "./student-performance-chart"
import { SubmissionTimeline } from "./submission-timeline"
import { ExamComparisonChart } from "./exam-comparison-chart"
import { OverallStatistics } from "./overall-statistics"

interface AnalyticsDashboardProps {
  exams: Exam[]
  submissions: Submission[]
}

export function AnalyticsDashboard({ exams, submissions }: AnalyticsDashboardProps) {
  // Calculate overall statistics
  const totalExams = exams.length
  const totalSubmissions = submissions.length
  const totalStudents = new Set(submissions.map((s) => s.studentId)).size
  const averageScore = submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / submissions.length || 0

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Exam Analytics</h2>

      <OverallStatistics
        totalExams={totalExams}
        totalSubmissions={totalSubmissions}
        totalStudents={totalStudents}
        averageScore={averageScore}
      />

      <Tabs defaultValue="exam-performance">
        <TabsList>
          <TabsTrigger value="exam-performance">Exam Performance</TabsTrigger>
          <TabsTrigger value="student-performance">Student Performance</TabsTrigger>
          <TabsTrigger value="submission-timeline">Submission Timeline</TabsTrigger>
          <TabsTrigger value="exam-comparison">Exam Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="exam-performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Performance</CardTitle>
              <CardDescription>Average scores for each exam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ExamPerformanceChart exams={exams} submissions={submissions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Average scores for top students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <StudentPerformanceChart submissions={submissions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submission-timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission Timeline</CardTitle>
              <CardDescription>Number of submissions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <SubmissionTimeline submissions={submissions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam-comparison" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Comparison</CardTitle>
              <CardDescription>Compare performance across different exams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ExamComparisonChart exams={exams} submissions={submissions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
