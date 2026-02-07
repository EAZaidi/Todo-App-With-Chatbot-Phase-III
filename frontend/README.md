# Todo App Frontend

A modern Todo application frontend built with Next.js 16+, TypeScript, and Tailwind CSS.

## Tech Stack

- **Next.js 16.1.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.7** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **ESLint** - Code linting

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with Tailwind directives
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
├── lib/
│   ├── api/
│   │   ├── types.ts      # TypeScript interfaces for API
│   │   ├── client.ts     # Base API client with error handling
│   │   └── tasks.ts      # Task-specific API functions
│   └── utils/
│       └── date.ts       # Date formatting utilities
├── .env.example          # Environment variables template
├── .env.local           # Local environment variables
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_USER_ID=default-user
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

## API Integration

The frontend communicates with a FastAPI backend running on `http://localhost:8000`.

### API Client Features

- **Type-safe requests** - All API calls are typed with TypeScript interfaces
- **Error handling** - Custom `ApiError` class for HTTP errors
- **Centralized configuration** - Environment-based API URL and user ID
- **RESTful operations** - Full CRUD support for tasks

### Available API Functions

Located in `lib/api/tasks.ts`:

- `getTasks()` - Fetch all tasks for the user
- `getTask(taskId)` - Fetch a single task
- `createTask(data)` - Create a new task
- `updateTask(taskId, data)` - Update a task (PUT)
- `toggleTaskComplete(taskId, completed)` - Toggle task completion (PATCH)
- `deleteTask(taskId)` - Delete a task

## Development Guidelines

### TypeScript

- Strict mode enabled
- Explicit types for all API responses
- No `any` types allowed

### Styling

- Use Tailwind CSS utilities only
- Mobile-first responsive design
- Dark mode support with `prefers-color-scheme`

### Component Strategy

- Server Components by default for better performance
- Client Components (with `'use client'`) only when needed for:
  - Interactive UI (forms, buttons with handlers)
  - React hooks (useState, useEffect)
  - Browser APIs (localStorage, window)

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features

- View all tasks with title, description, and completion status
- Create new tasks with title and optional description
- Toggle task completion status with optimistic updates
- Edit existing tasks via modal dialog
- Delete tasks with confirmation dialog
- Responsive design (mobile, tablet, desktop)
- Accessible UI with ARIA attributes and keyboard navigation
- Error handling with user-friendly messages
