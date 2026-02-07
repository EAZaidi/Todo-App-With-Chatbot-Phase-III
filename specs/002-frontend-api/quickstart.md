# Quickstart: Frontend Application & API Integration

**Feature**: 002-frontend-api
**Date**: 2026-01-10

## Prerequisites

Before running the frontend, ensure you have:

1. **Node.js 20+** installed
   ```bash
   node --version  # Should show v20.x.x or higher
   ```

2. **Backend API running** (from 001-backend-todo-api)
   ```bash
   # In backend/ directory
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Verify: `curl http://localhost:8000` should return `{"status":"ok",...}`

---

## Quick Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` file:

```bash
# Copy example and edit
cp .env.example .env.local
```

Contents of `.env.local`:
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Default user ID (until authentication is implemented)
NEXT_PUBLIC_DEFAULT_USER_ID=default-user
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Open Application

Navigate to: **http://localhost:3000**

---

## Verification Checklist

After starting, verify the following:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open http://localhost:3000 | Page loads without errors |
| 2 | Check browser console | No JavaScript errors |
| 3 | View task list | Tasks display (or empty state) |
| 4 | Create a task | Task appears in list |
| 5 | Toggle task complete | Checkbox changes, persists on refresh |
| 6 | Edit a task | Modal opens, changes save |
| 7 | Delete a task | Task removed after confirmation |

---

## Common Issues

### Backend Not Running

**Symptom**: "Failed to fetch" or network error

**Solution**: Start backend first:
```bash
cd backend
uvicorn src.main:app --reload
```

### CORS Error

**Symptom**: Cross-Origin Request Blocked

**Solution**: Backend CORS is configured for development. Ensure backend is running with default settings.

### Environment Variable Not Loading

**Symptom**: API URL is undefined

**Solution**:
1. Ensure `.env.local` exists in frontend root
2. Variables must start with `NEXT_PUBLIC_`
3. Restart dev server after changing env vars

### Port Already in Use

**Symptom**: Error: listen EADDRINUSE :::3000

**Solution**:
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Main task list page
│   ├── loading.tsx       # Loading skeleton
│   └── error.tsx         # Error boundary
├── components/
│   ├── TaskList.tsx      # Task list with all items
│   ├── TaskItem.tsx      # Single task row
│   ├── TaskForm.tsx      # Create task form
│   ├── EditTaskModal.tsx # Edit dialog
│   └── DeleteConfirm.tsx # Delete confirmation
├── lib/
│   ├── api/
│   │   ├── client.ts     # API client wrapper
│   │   ├── tasks.ts      # Task API functions
│   │   └── types.ts      # TypeScript interfaces
│   └── utils/
│       └── date.ts       # Date formatting
├── .env.example          # Example environment variables
├── .env.local            # Local environment (gitignored)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── tailwind.config.js    # Tailwind CSS config
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_DEFAULT_USER_ID` | Yes | `default-user` | User ID for API requests |

---

## Development Workflow

1. **Start Backend** (terminal 1):
   ```bash
   cd backend && uvicorn src.main:app --reload
   ```

2. **Start Frontend** (terminal 2):
   ```bash
   cd frontend && npm run dev
   ```

3. **Make Changes**: Edit files in `frontend/` - hot reload is enabled

4. **Verify API**: Check backend at http://localhost:8000/docs (Swagger UI)

---

## Next Steps After Setup

1. Create a few test tasks
2. Verify all CRUD operations work
3. Test responsive design on mobile viewport
4. Check error handling by stopping backend
5. Review console for any warnings
