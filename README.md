# AgentBoard

Kanban-style task board where AI agents (Claude Code CLI) autonomously pick up and execute tasks. Create tasks on the board, start the dispatcher, and watch Claude agents work through them — with real-time log streaming, auto-retry on failure, and manual stop/retry controls.

<img width="2378" height="959" alt="image" src="https://github.com/user-attachments/assets/38e5d469-1aad-4053-9fd8-77fc708923fb" />


## Features

- **3-column Kanban board** — To Do, In Progress, Done (with drag-and-drop)
- **Agent dispatcher** — polls for queued tasks and spawns up to 2 concurrent Claude CLI subprocesses
- **Real-time updates** — SSE-powered live board updates across browser tabs
- **Log streaming** — color-coded stdout/stderr/system logs per task
- **Auto-retry** — failed tasks automatically retry (configurable max retries per task)
- **Manual controls** — stop running agents, retry failed tasks, delete tasks
- **Task priorities** — High / Medium / Low with priority-based scheduling

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | SQLite via Prisma 7 + better-sqlite3 |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | React Query + SSE (Server-Sent Events) |
| Drag & Drop | @hello-pangea/dnd |
| Validation | Zod v4 |
| Agent Runtime | Claude Code CLI (spawned as subprocess) |

## Prerequisites

- **Node.js** >= 18
- **Claude Code CLI** installed and authenticated (`claude` must be available on PATH)

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client + create SQLite database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Click **+ New Task** to create a task with a title, description, acceptance criteria, working directory, and priority
2. Click **Start Dispatcher** — the dispatcher polls every 5 seconds for queued tasks
3. Tasks move from **To Do** → **In Progress** automatically as agents pick them up
4. Click a task card to open the detail panel with live agent logs
5. Tasks move to **Done** on success, or **Failed** on error (with auto-retry if retries remain)
6. Use **Stop Agent** to kill a running task, or **Retry** to re-queue a failed one

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── tasks/          # CRUD + stop/retry/logs endpoints
│   │   ├── dispatcher/     # Start/stop/status controls
│   │   └── events/         # SSE stream
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx       # React Query provider
├── components/
│   ├── board/              # Board, Column, TaskCard, TaskCardDetail
│   ├── forms/              # CreateTaskForm
│   ├── logs/               # LogViewer
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── useTasksQuery.ts    # React Query hooks for all API calls
│   └── useEventSource.ts   # SSE subscription
└── lib/
    ├── db.ts               # Prisma client singleton
    ├── dispatcher.ts        # Agent dispatcher (polls + spawns agents)
    ├── agent-process.ts     # Claude CLI subprocess wrapper
    ├── event-emitter.ts     # SSE event bus
    ├── types.ts             # Status/priority constants
    └── utils.ts             # cn(), formatDuration()
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/[id]` | Get a single task |
| PATCH | `/api/tasks/[id]` | Update a task |
| DELETE | `/api/tasks/[id]` | Delete a task |
| POST | `/api/tasks/[id]/stop` | Kill running agent |
| POST | `/api/tasks/[id]/retry` | Re-queue failed task |
| GET | `/api/tasks/[id]/logs` | Fetch task logs (supports `?after=timestamp`) |
| GET | `/api/dispatcher` | Dispatcher status |
| POST | `/api/dispatcher` | Start/stop dispatcher (`{"action": "start\|stop"}`) |
| GET | `/api/events` | SSE event stream |

## How the Dispatcher Works

1. Polls the database every 5 seconds for tasks with `status: "todo"`
2. Picks tasks ordered by priority (high first), then creation time
3. Creates an isolated workspace at `workspaces/<taskId>/` (or uses a custom working directory if provided)
4. Builds an autonomous prompt from the task fields and pipes it via stdin to `claude -p`
5. Agent runs with `--permission-mode bypassPermissions` so it can freely use Write, Edit, Bash, and other tools
6. Streams agent output (`--output-format stream-json --verbose`) into the `TaskLog` table, batched every 500ms
7. On completion: marks task as `done`. On failure: auto-retries or marks as `failed`
8. On startup: detects orphaned `in_progress` tasks (stale PIDs from server restart) and marks them failed

## License

MIT
