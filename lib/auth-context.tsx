"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { account } from "./appwrite"
import { useToast } from "@/hooks/use-toast"

type User = {
  id: string
  name: string
  email: string
  role: "tutor" | "student"
  studentId?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  studentLogin: (name: string, email: string, studentId: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try to get the current session
        if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
          // If Appwrite is not configured, check session storage
          const storedUser = sessionStorage.getItem("user")
          if (storedUser) {
            setUser(JSON.parse(storedUser))
          }
          setIsLoading(false)
          return
        }

        const session = await account.getSession("current")

        // If we have a session, get the user data
        if (session) {
          // Get account details
          const accountDetails = await account.get()

          // Get user data from session storage (role, etc.)
          const storedUser = sessionStorage.getItem("user")
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUser({
              id: accountDetails.$id,
              name: accountDetails.name,
              email: accountDetails.email,
              role: userData.role,
              ...(userData.studentId && { studentId: userData.studentId }),
            })
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
        // No active session
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Login function for tutors
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Check if Appwrite is configured
      if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
        // Fallback for when Appwrite is not configured
        console.warn("Appwrite not configured, using fallback login")

        // Simple validation for demo purposes
        if (email === "tutor@example.com" && password === "password") {
          const mockUser = {
            id: "demo-tutor-id",
            name: "Demo Tutor",
            email,
            role: "tutor" as const,
          }

          // Store user in state and session storage
          setUser(mockUser)
          sessionStorage.setItem("user", JSON.stringify(mockUser))

          toast({
            title: "Login successful",
            description: "Welcome back, Demo Tutor!",
          })

          return
        } else {
          throw new Error("Invalid credentials")
        }
      }

      // Create email session with Appwrite
      await account.createEmailSession(email, password)

      // Get account details
      const accountDetails = await account.get()

      // For a real app, you would fetch the user's role from your database
      // For this demo, we'll assume it's a tutor
      const userData = {
        id: accountDetails.$id,
        name: accountDetails.name,
        email: accountDetails.email,
        role: "tutor" as const,
      }

      // Store user in state and session storage
      setUser(userData)
      sessionStorage.setItem("user", JSON.stringify(userData))

      toast({
        title: "Login successful",
        description: `Welcome back, ${accountDetails.name}!`,
      })
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Login function for students (no password required)
  const studentLogin = async (name: string, email: string, studentId: string) => {
    try {
      setIsLoading(true)

      // For students, we don't create an Appwrite account
      // Instead, we just store their info in session storage
      const userData = {
        id: `student-${studentId}`,
        name,
        email,
        role: "student" as const,
        studentId,
      }

      // Store user in state and session storage
      setUser(userData)
      sessionStorage.setItem("user", JSON.stringify(userData))

      toast({
        title: "Login successful",
        description: `Welcome, ${name}!`,
      })
    } catch (error) {
      console.error("Student login error:", error)
      toast({
        title: "Login failed",
        description: "There was an error logging in. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true)

      // Check if Appwrite is configured
      if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
        try {
          // Delete the current session
          await account.deleteSession("current")
        } catch (error) {
          console.error("Error deleting session:", error)
        }
      }

      // Clear user from state and session storage
      setUser(null)
      sessionStorage.removeItem("user")
      sessionStorage.removeItem("studentInfo")
      sessionStorage.removeItem("tutorInfo")

      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        studentLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
