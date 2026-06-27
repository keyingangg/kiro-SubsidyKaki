# SubsidyKaki

A web app built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

- **Next.js 16** — App Router, TypeScript
- **Tailwind CSS v4** — utility-first styling
- **Supabase** — database, auth, and backend services

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local` and fill in your Supabase credentials from the [Supabase dashboard](https://supabase.com/dashboard) → Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/          # Next.js App Router pages and layouts
└── lib/
    └── supabase/
        ├── client.ts   # Browser client (Client Components)
        └── server.ts   # Server client (Server Components, Route Handlers, Server Actions)
```

## Supabase Usage

**In Client Components:**
```ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

**In Server Components / Route Handlers / Server Actions:**
```ts
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```
