# ABC Fun Cards

An interactive flashcard app to help toddlers learn the alphabet with spaced repetition, progress tracking, and achievements.

## Features

- **3D Flip Cards** - Interactive cards with smooth animations
- **Spaced Repetition** - Smart learning algorithm that adapts to your child's progress
- **Cross-Device Sync** - Progress syncs across all devices via Supabase
- **Achievements** - Earn badges for learning milestones
- **Text-to-Speech** - Audio pronunciation of letters and words
- **Progress Migration** - Existing localStorage progress migrates automatically on first login

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings > API** and copy your:
   - Project URL
   - `anon` public key

### 2. Set Up Environment Variables

Copy the example env file and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up the Database

1. Go to the **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the query to create tables and security policies

### 4. Enable Authentication

1. In Supabase, go to **Authentication > Providers**
2. Enable **Email** (enabled by default)
3. (Optional) Enable **Google** OAuth for one-click sign-in

### 5. Run the Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Deploy to Vercel with one click:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Login page
│   ├── play/
│   │   ├── page.tsx          # Main game
│   │   └── achievements/     # Achievements page
│   └── auth/callback/        # OAuth handler
├── components/
│   ├── FlashCard.tsx         # 3D flip card
│   ├── GameControls.tsx      # Easy/Hard buttons
│   ├── StarJar.tsx           # Star counter
│   └── Confetti.tsx          # Celebration effect
├── hooks/
│   └── useGameState.ts       # Game state management
└── lib/
    ├── supabase/             # Supabase clients
    ├── letters.ts            # Alphabet data
    ├── srs.ts                # Spaced repetition logic
    ├── achievements.ts       # Achievement definitions
    └── migration.ts          # localStorage migration
```
