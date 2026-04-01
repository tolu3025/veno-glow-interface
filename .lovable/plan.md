## Plan: Upgrade JAMB CBT to Real Exam Experience

### Problem Analysis

1. **404 on JAMB Challenge**: Route `/cbt/jamb-challenge` exists in `App.routes.tsx` but is NOT registered in `App.tsx` (the actual router). Missing import + route.
2. **Scoring is percentage-based (out of 100)**, not JAMB-standard (out of 400).
3. **Exam interface shows all questions at once** per subject instead of one-at-a-time with a question navigation panel.
4. **No passage/instruction support**, no image support, no explanations after exam.
5. **No review before submission**.

---

### 1. Fix JAMB Challenge 404

**File: `src/App.tsx**`

- Add `import JambChallengeLeaderboard from "./pages/cbt/JambChallengeLeaderboard"`
- Add route: `<Route path="/cbt/jamb-challenge" element={<JambChallengeLeaderboard />} />` inside MainLayout

---

### 2. JAMB Scoring System (Over 400)

**File: `src/pages/cbt/JambMode.tsx**` — Results phase

Current scoring: percentage out of 100. Change to:

- Each subject scored out of 100 marks: `(correct / total) * 100` rounded
- Total JAMB score = sum of 4 subject scores (max 400)
- English   as one subject score (60 questions → score out of 100)
- Display: total score `/400`, individual subject scores `/100`
- Update challenge points recording to use the `/400` score

---

### 3. JAMB-Exact Question Interface (Major Rewrite of Exam Phase)

**File: `src/pages/cbt/JambMode.tsx**` — Exam phase

Replace the "all questions visible" layout with a real JAMB CBT interface:

```text
┌──────────────────────────────────────────┐
│ Timer    Subject Tabs    [Submit All]     │
├──────────────────┬───────────────────────┤
│                  │  Question Numbers     │
│  Question Area   │  Grid (1-40)          │
│                  │  ● Answered (green)   │
│  Q12 of 40       │  ○ Unanswered (gray)  │
│  [Question text] │  Click to jump        │
│                  │                       │
│  ○ A. Option     │                       │
│  ● B. Option     │                       │
│  ○ C. Option     │                       │
│  ○ D. Option     │                       │
│                  │                       │
│  [Prev] [Next]   │                       │
└──────────────────┴───────────────────────┘
```

Key features:

- One question at a time with `currentQuestionIndex` state per subject
- Question navigation sidebar/panel showing answered vs unanswered
- Click any number to jump to that question
- Prev/Next buttons
- Support `dangerouslySetInnerHTML` for HTML content from ALOC (passages, images, instructions)
- ALOC questions include `section` field — group questions with same section under a shared passage/instruction header
- Support images in questions (ALOC may include `<img>` tags in HTML)
- On mobile: question nav panel becomes a collapsible bottom sheet or horizontal scrollable strip
- JAMB green/white/black color scheme

---

### 4. Passage & Instruction Support

In the question display area:

- If the current question's `section` field contains passage text, show it above the question
- Keep passage visible while answering linked questions (same section)
- Style as a distinct bordered block above the question

---

### 5. Review Before Submission

Add a review screen triggered by "Submit All":

- Show all subjects with answered/unanswered counts
- List unanswered question numbers per subject
- Confirm dialog: "Are you sure? X questions unanswered"
- Only submit after confirmation

---

### 6. Explanations After Exam

**File: `src/pages/cbt/JambMode.tsx**` — Results phase

Add a "View Explanations" button on results that navigates to a new explanations view:

- Show each question with the user's answer, correct answer highlighted
- For ALOC questions, the `answer` field shows the correct option letter
- Color-code: green for correct, red for wrong
- Group by subject with tabs

---

### 7. UI/UX — JAMB Brand Colors

Apply JAMB-inspired styling to the exam interface:

- Primary: light green (`#4CAF50` / `#388E3C`)
- Background: white
- Text: black
- Clean, distraction-free, no decorative elements during exam

---

### 8. Auto-Submit on Timer Expiry

Already implemented but needs to work with the new one-at-a-time interface. Ensure `handleSubmit` is stable via `useCallback` with correct dependencies.

---

### 9. Remove Last 10 Questions (Server Logic)

**File: `supabase/functions/fetch-jamb-questions/index.ts**`

After fetching from ALOC, slice off the last 10 questions per subject before returning:

```typescript
questions: data.data?.slice(0, -10) || []
```

This ensures the final 10 questions from each API response are excluded (they tend to be less reliable).

---

### Files to Modify


| File                                               | Changes                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                                      | Add JAMB Challenge route + import                                                                                   |
| `src/pages/cbt/JambMode.tsx`                       | Complete rewrite of exam UI (one-at-a-time, nav panel, JAMB scoring /400, review screen, explanations, JAMB colors) |
| `supabase/functions/fetch-jamb-questions/index.ts` | Slice last 10 questions per subject                                                                                 |


### Files Unchanged

- `src/pages/cbt/JambChallengeLeaderboard.tsx` — Already functional, just needs route fix
- Database schema — No changes needed
- Also add literature in English as subject 