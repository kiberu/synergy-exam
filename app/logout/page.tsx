"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

export default function LogoutPage() {
  const { logout } = useAuth()

  useEffect(() => {
    logout()
  }, [logout])

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <p>Logging out...</p>
    </div>
  )
}
