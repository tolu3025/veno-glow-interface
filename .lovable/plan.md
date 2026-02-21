

## Plan: Course Material Test Enhancements

### Overview
Four key changes to the Course Material Test feature:

1. **Add "Course Material Test" to navigation menus** so users can easily find it
2. **Ask users to choose Essay or MCQ** after uploading a document
3. **Generate 10 essay OR 40 MCQ questions** based on user choice (instead of the current fixed 10 obj + 5 short + 5 essay)
4. **Preserve uploaded document after test completion** with separate "Regenerate" and "Upload New Document" buttons

---

### 1. Add to Navigation Menus

Add a "Course Material" link in two places:

- **AppNavigation sidebar** (`src/components/cbt/AppNavigation.tsx`): Add a new nav item with `FileText` icon pointing to `/cbt/course-material-test`
- **Mobile menu** (`src/components/ui/mobile-menu.tsx`): Add to the app links section

### 2. Question Type Selection After Upload

In `src/components/cbt/StudentDocumentUpload.tsx` and `src/pages/cbt/CourseMaterialTest.tsx`:

- After a document is uploaded (file selected), show a question type selector: **"Essay"** or **"MCQ (Multiple Choice)"**
- Store the selected type in state (`questionType: 'essay' | 'mcq'`)
- Pass this choice to the edge function when generating questions

### 3. Update Edge Function for Dynamic Question Counts

In `supabase/functions/generate-pdf-questions/index.ts`:

- Accept a new parameter `question_type` (`'essay'` or `'mcq'`)
- If `mcq`: Update the system prompt to generate **40 objective questions** only (no essay/short answer sections)
- If `essay`: Update the system prompt to generate **10 essay questions** only
- Increase `max_tokens` to handle 40 MCQ questions (approximately 8000 tokens)
- Update the parsing logic to handle the new formats

### 4. Preserve Document & Regenerate Flow

In `src/pages/cbt/CourseMaterialTest.tsx`:

- Store the last uploaded document content and metadata in state (e.g., `lastUploadedContent`, `lastUploadMeta`)
- When "New Test" is clicked after results:
  - Clear questions and answers but **keep** the document data
  - Show the question type selector again so user can regenerate
- Add a separate **"Upload New Document"** button that fully resets everything (clears document + questions)
- The `StudentDocumentUpload` component will pass extracted text back to parent so it can be reused

---

### Technical Details

**Files to modify:**
- `src/components/cbt/AppNavigation.tsx` -- add nav item
- `src/components/ui/mobile-menu.tsx` -- add nav item  
- `src/components/cbt/StudentDocumentUpload.tsx` -- add question type selection, pass extracted content up to parent
- `src/pages/cbt/CourseMaterialTest.tsx` -- question type state, regenerate vs new document flow, persist document data
- `supabase/functions/generate-pdf-questions/index.ts` -- accept `question_type`, dynamic prompt/parsing for 40 MCQ or 10 essay

**Edge function prompt changes:**
- MCQ mode: "Generate exactly 40 multiple-choice objective questions with 4 options each"
- Essay mode: "Generate exactly 10 essay questions with key points for each"
- `max_tokens` increased from 4500 to ~8000 for 40 MCQ questions

**State flow for document persistence:**

```text
User uploads doc --> Extracts text --> Stores in state
  --> Picks MCQ or Essay --> Generates questions --> Takes test
    --> "Regenerate" --> Goes back to type picker (doc still loaded)
    --> "Upload New Document" --> Full reset
```

