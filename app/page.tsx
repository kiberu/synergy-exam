import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Online Examination System</CardTitle>
          <CardDescription>Take exams created by your tutors</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/student/login" passHref>
            <Button className="w-full">Student Login</Button>
          </Link>
          <Link href="/tutor/login" passHref>
            <Button variant="outline" className="w-full">
              Tutor Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
