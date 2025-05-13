"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function NavBar() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Online Exam System
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {user?.role === "tutor" ? (
                <>
                  <Link href="/tutor/dashboard">
                    <Button variant={pathname === "/tutor/dashboard" ? "default" : "ghost"}>Dashboard</Button>
                  </Link>
                  <Link href="/tutor/exams/create">
                    <Button variant={pathname === "/tutor/exams/create" ? "default" : "ghost"}>Create Exam</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/student/dashboard">
                    <Button variant={pathname === "/student/dashboard" ? "default" : "ghost"}>Dashboard</Button>
                  </Link>
                  <Link href="/student/exams">
                    <Button variant={pathname === "/student/exams" ? "default" : "ghost"}>Available Exams</Button>
                  </Link>
                </>
              )}
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/student/login">
                <Button variant={pathname === "/student/login" ? "default" : "ghost"}>Student Login</Button>
              </Link>
              <Link href="/tutor/login">
                <Button variant={pathname === "/tutor/login" ? "default" : "ghost"}>Tutor Login</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
