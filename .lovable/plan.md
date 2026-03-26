

## Plan: Simplify Website and PWA

### Goal
Make Veno's core purpose (CBT/Test Practice) immediately obvious. Remove clutter, reduce choices, and guide users to the main actions.

---

### 1. Simplify Website Homepage (`src/pages/Index.tsx`)

**Remove**: Course Progress Table, Tutorials Section, Features Section, Ads, Testimonial section

**New structure**:
- **Hero banner** (keep existing carousel but simplify to 2 slides focused on CBT)
- **3 Action Cards** -- large, clear cards with icons:
  1. "Take a Test" -> `/cbt` (CBT practice)
  2. "AI Study Assistant" -> `/ai-assistant` (AI-powered help)
  3. "Challenge Friends" -> `/cbt/streak-challenge` (PvP challenges)
- **Course Materials Section** -- a simple card linking to `/cbt/course-material-test` with a brief description ("Upload your course material and generate practice tests instantly")
- **Call to Action** (keep existing)

**Also update `src/data/homePageData.ts`**: Reduce `bannerSlides` from 4 to 2 (keep the CBT-focused ones).

### 2. Simplify PWA Home (`src/pages/pwa/PWAHome.tsx`)

**Reduce from 16 app icons to 6 core apps**:
1. CBT Tests (`/cbt`)
2. AI Assistant (`/ai-assistant`)
3. Challenge (`/cbt/streak-challenge`)
4. Course Material (`/cbt/course-material-test`)
5. Past Questions (`/cbt/past-questions`)
6. Analytics (`/cbt/analytics`)

Remove: Library, Leaderboard, Streaks, Voice Tutor, Bot, Org Exam, Profile, Settings, Dashboard, Tutorials (these are still accessible via navigation/menus, just not on the home screen).

### 3. Simplify Navigation (`src/layouts/MainLayout.tsx`)

**Reduce header nav links** from 6 to 4:
- Home, CBT, AI Assistant, Course Material

Keep Blog in footer or mobile menu only. Remove Voice Tutor and Streak Challenge from top nav (still accessible from homepage cards and CBT pages).

---

### Technical Details

**Files to modify:**
- `src/pages/Index.tsx` -- Replace sections with 3 action cards + course materials card
- `src/data/homePageData.ts` -- Reduce banner slides to 2
- `src/pages/pwa/PWAHome.tsx` -- Reduce apps array to 6 items
- `src/layouts/MainLayout.tsx` -- Simplify `mainLinks` array to 4 items

No new components needed -- the action cards will be simple inline cards using existing `Card` or styled divs with icons and navigation.

