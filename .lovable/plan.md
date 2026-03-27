## Plan: Redesign CBT with JAMB Mode + Practice Mode

### Overview

Simplify the CBT experience into two clear paths: **JAMB Mode** (full UTME simulation) and **Practice Mode** (free practice from question bank). Remove VenoBot and public leaderboards.

---

### 1. Remove VenoBot

**Files to modify:**

- `src/App.tsx` -- Remove `/bot` route
- `src/pages/BotPage.tsx` -- Delete file
- Any navigation references to BotPage

### 2. Remove Public Leaderboards

**Files to modify:**

- `src/App.tsx` -- Remove `/cbt/public-leaderboards` route
- `src/pages/cbt/PublicLeaderboards.tsx` -- Delete file
- `src/App.routes.tsx` -- Remove public leaderboards entry
- `src/components/cbt/AppNavigation.tsx` -- Remove leaderboard nav item if present

### 3. Redesign CBT Landing Page (`src/pages/CbtPage.tsx`)

Replace the current complex page with a clean two-card layout:

```text
┌─────────────────────────────────┐
│         Choose Your Mode        │
├────────────────┬────────────────┤
│   🎯 JAMB     │   📚 Practice  │
│   Mode        │   Mode         │
│               │                │
│ Full UTME     │ Pick a subject │
│ simulation    │ and practice   │
│ 4 subjects    │ at your pace   │
│ Timed exam    │                │
│               │                │
│ [Start JAMB]  │ [Start Practice]│
└────────────────┴────────────────┘
│  + Create Custom Test (small)   │
│  + Course Material Test (small) │
└─────────────────────────────────┘
```

Below the two main cards, show smaller action buttons for "Create Custom Test" and "Course Material Test" for power users.

### 4. Create JAMB Mode Page (`src/pages/cbt/JambMode.tsx`)

**Step 1 -- Subject Selection:**

- English is auto-selected (compulsory, 60 questions)
- Literature (lekki headmaster) auto-included (10 questions)
- User picks 3 more subjects from JAMB subject list (40 questions each)
- Total: 60 + 10 + 40 + 40 + 40 = 190 questions
- Time: Real JAMB timing (2 hours total, or configurable)

**JAMB subjects available:** Mathematics, Physics, Chemistry, Biology, Commerce, Accounting, Government, CRK, Geography, Economics, Literature (englishlit)

**Step 2 -- Exam:**

- Fetch questions from ALOC API via edge function
- Display one subject at a time with a subject tab bar
- Timer counts down from total time
- Submit all at once at the end

**Step 3 -- Results:**

- Score per subject + overall percentage
- Simple pass/fail indication

### 5. Create Edge Function (`supabase/functions/fetch-jamb-questions/index.ts`)

Proxies requests to the ALOC API:

- Accepts: `{ subjects: string[], type: "utme" }`
- For each subject, calls `https://questions.aloc.com.ng/api/v2/q/{count}?subject={subject}&type=utme`
- Uses ALOC access token stored as a Supabase secret
- Returns combined questions grouped by subject
- English: fetches 60 questions
- Literature (englishlit): fetches 10 questions
- Other subjects: fetches 40 questions each

**New secret needed:** `ALOC_ACCESS_TOKEN`

### 6. Update Practice Mode

Keep the existing `QuizSection` component mostly as-is but move it to its own clean page at `/cbt/practice`. Users pick one subject, set difficulty/time/count, and practice.

### 7. Update Routes (`src/App.tsx`)

- Add `/cbt/jamb` route for JAMB mode page
- Add `/cbt/practice` route for practice mode
- Keep `/cbt` as the mode selection landing page
- Remove `/bot` and `/cbt/public-leaderboards`

---

### Technical Details

**Files to create:**

- `src/pages/cbt/JambMode.tsx` -- JAMB subject selection + exam flow
- `src/pages/cbt/PracticeMode.tsx` -- Wrapper around existing QuizSection
- `supabase/functions/fetch-jamb-questions/index.ts` -- ALOC API proxy

**Files to modify:**

- `src/pages/CbtPage.tsx` -- Replace with simple two-card mode selector
- `src/App.tsx` -- Update routes (add JAMB/practice, remove bot/public-leaderboards)
- `src/components/cbt/AppNavigation.tsx` -- Update nav items
- `src/pages/Index.tsx` -- Update "Take a Test" card to point to new `/cbt`

**Files to delete:**

- `src/pages/BotPage.tsx`
- `src/pages/cbt/PublicLeaderboards.tsx`

**ALOC API format (per their docs):**

```
GET https://questions.aloc.com.ng/api/v2/q/40?subject=mathematics&type=utme
Header: AccessToken: {ALOC_ACCESS_TOKEN}
```

Response returns questions with `question`, `option` (A-E), `answer`, `section`, `examtype`, `examyear`.

**Secret required:** User will need to provide their ALOC access token before JAMB mode works.

Make sure to include all jamb subjects available English is compulsory though 