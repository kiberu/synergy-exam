"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import type { Submission } from "@/lib/appwrite"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns"

interface SubmissionTimelineProps {
  submissions: Submission[]
}

export function SubmissionTimeline({ submissions }: SubmissionTimelineProps) {
  // Get the date range for the last 30 days
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)

  // Create an array of dates for the last 30 days
  const dateRange = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: today,
  })

  // Initialize submission counts for each day
  const submissionCounts = dateRange.map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    count: 0,
  }))

  // Count submissions for each day
  submissions.forEach((submission) => {
    const submissionDate = parseISO(submission.submittedAt)

    // Only count submissions within the last 30 days
    if (submissionDate >= thirtyDaysAgo && submissionDate <= today) {
      const dateStr = format(submissionDate, "yyyy-MM-dd")
      const index = submissionCounts.findIndex((item) => item.date === dateStr)

      if (index !== -1) {
        submissionCounts[index].count += 1
      }
    }
  })

  return (
    <ChartContainer
      config={{
        count: {
          label: "Submissions",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={submissionCounts} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={70}
            tickFormatter={(value) => format(parseISO(value), "MMM dd")}
          />
          <YAxis />
          <ChartTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                        <span className="font-bold text-muted-foreground">
                          {format(parseISO(data.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Submissions</span>
                        <span className="font-bold">{data.count}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            name="Submissions"
            stroke="var(--color-count)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
