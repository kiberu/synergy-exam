"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function EnvironmentVariableCheck() {
  const missingVars = []

  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    missingVars.push("NEXT_PUBLIC_APPWRITE_ENDPOINT")
  }

  if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    missingVars.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID")
  }

  if (missingVars.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>
        <p>The following environment variables are missing:</p>
        <ul className="list-disc pl-5 mt-2">
          {missingVars.map((variable) => (
            <li key={variable}>{variable}</li>
          ))}
        </ul>
        <p className="mt-2">
          Please add these to your <code>.env.local</code> file or Vercel project settings.
        </p>
      </AlertDescription>
    </Alert>
  )
}
