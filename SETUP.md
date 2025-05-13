# Setting Up the Online Examination System

This guide will help you set up the Online Examination System with Appwrite as the backend.

## Prerequisites

1. Node.js 16+ installed
2. An Appwrite account and project
3. API key with all necessary permissions

## Step 1: Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
\`\`\`

## Step 2: Install Dependencies

\`\`\`bash
npm install
\`\`\`

## Step 3: Set Up Appwrite Collections

Run the setup script to create the necessary collections in Appwrite:

\`\`\`bash
npm run setup-appwrite
\`\`\`

This script will:
- Create a database called `online_exam_db`
- Create collections for users, exams, questions, and submissions
- Set up the necessary attributes for each collection

## Step 4: Seed the Database

Run the seeder script to populate the database with sample data:

\`\`\`bash
npm run seed
\`\`\`

This will create:
- A demo tutor account
- Sample student accounts
- Example exams with questions
- Sample submissions

## Step 5: Run the Application

\`\`\`bash
npm run dev
\`\`\`

The application will be available at http://localhost:3000

## Step 6: Login Credentials

### Tutor Login
- Email: tutor@example.com
- Password: password

### Student Login
Students can log in with their name, email (optional), and student ID.

Sample student IDs from the seeder:
- S12345 (John Doe)
- S12346 (Jane Smith)

## Troubleshooting

If you encounter any issues:

1. Check that your environment variables are correctly set
2. Ensure your Appwrite API key has the necessary permissions
3. Check the console for any error messages
4. Try running the setup and seed scripts again

## All-in-One Setup

To run both the setup and seed scripts in one command:

\`\`\`bash
npm run init-appwrite
