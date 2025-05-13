# Online Examination System

An online examination system built with Next.js and Appwrite, allowing tutors to create exams and students to take them.

## Features

- **Tutor Features**:
  - Create exams with multiple-choice and text questions
  - Set exam duration
  - View student submissions and results
  - Grade submissions

- **Student Features**:
  - Take exams with a countdown timer
  - Answer multiple-choice and text questions
  - Navigate between questions
  - Submit answers

## Quick Start

1. Clone the repository
2. Set up environment variables:
   \`\`\`
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   APPWRITE_API_KEY=your-api-key
   \`\`\`
3. Install dependencies: `npm install`
4. Initialize Appwrite: `npm run init-appwrite`
5. Run the development server: `npm run dev`

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Usage

### Tutor Login

- Email: tutor@example.com
- Password: password

### Student Login

Students can log in with their name, email (optional), and student ID.

Sample student IDs from the seeder:
- S12345 (John Doe)
- S12346 (Jane Smith)

## Development

### Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable UI components
- `/lib` - Utility functions and Appwrite integration
- `/scripts` - Database seeder scripts

### Adding New Features

1. Create new components in the `/components` directory
2. Add new pages in the `/app` directory
3. Update Appwrite integration in the `/lib` directory as needed

## License

MIT
