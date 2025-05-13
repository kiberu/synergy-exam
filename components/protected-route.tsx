"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("tutor" | "student")[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Not authenticated, redirect to login
      router.push("/")
      return
    }

    if (!isLoading && isAuthenticated && allowedRoles && user) {
      // Check if user has the required role
      if (!allowedRoles.includes(user.role)) {
        // User doesn't have the required role
        if (user.role === "tutor") {
          router.push("/tutor/dashboard")
        } else {
          router.push("/student/exams")
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router, allowedRoles])

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!isAuthenticated) {
    return null
  }

  // If roles are specified and user doesn't have the required role, don't render children
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  // Otherwise, render children
  return <>{children}</>
}
