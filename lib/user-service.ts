import { account, COLLECTIONS, createDocument, listDocuments, type User } from "./appwrite"
import { ID, Query } from "appwrite"

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "tutor" | "student",
  studentId?: string,
) {
  try {
    // Create the user account
    const newAccount = await account.create(ID.unique(), email, password, name)

    // Create the user document in the database
    const userData: User = {
      name,
      email,
      role,
      ...(studentId && { studentId }),
    }

    const user = await createDocument(COLLECTIONS.USERS, userData, newAccount.$id)

    return user
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Login a user
export async function loginUser(email: string, password: string) {
  try {
    const session = await account.createEmailSession(email, password)
    const accountDetails = await account.get()

    // Get the user document
    const users = await listDocuments(COLLECTIONS.USERS, [Query.equal("email", email)])

    if (users.documents.length === 0) {
      throw new Error("User not found")
    }

    const user = users.documents[0] as unknown as User

    return {
      session,
      user,
    }
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

// Get the current user
export async function getCurrentUser() {
  try {
    const accountDetails = await account.get()

    // Get the user document
    const users = await listDocuments(COLLECTIONS.USERS, [Query.equal("email", accountDetails.email)])

    if (users.documents.length === 0) {
      throw new Error("User not found")
    }

    const user = users.documents[0] as unknown as User

    return {
      accountDetails,
      user,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Logout the current user
export async function logoutUser() {
  try {
    await account.deleteSession("current")
    return true
  } catch (error) {
    console.error("Error logging out:", error)
    throw error
  }
}

// Student login (without registration)
export async function studentLogin(name: string, email: string, studentId: string) {
  try {
    // Check if student exists
    const students = await listDocuments(COLLECTIONS.USERS, [Query.equal("studentId", studentId)])

    let student

    if (students.documents.length === 0) {
      // Create a new student document
      student = await createDocument(COLLECTIONS.USERS, {
        name,
        email,
        role: "student",
        studentId,
      })
    } else {
      student = students.documents[0]
    }

    return student as unknown as User
  } catch (error) {
    console.error("Error with student login:", error)
    throw error
  }
}
