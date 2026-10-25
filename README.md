# myFuture Nigeria

A free, private questionnaire that helps Nigerian secondary-school leavers choose a course of study and career. Students answer about 80 short questions (results, UTME subjects, strengths, interests, values, budget, family expectations). The site turns the answers into a single, well-structured prompt that they copy into ChatGPT, Claude, Gemini, Meta AI or Copilot to get personal advice.

- **No server of its own, no API keys.** Everything runs in the student's browser. The only optional online piece is an access-code check run from a Google Sheet (see *Access codes* below).
- **Private.** Answers are saved only in the student's own browser (localStorage) so they can stop and resume. Answers are never sent anywhere; if access codes are switched on, only the code is checked.
- **Phone-first and light.** Plain HTML, CSS and JavaScript; no frameworks or build step. About 65 KB plus two web fonts.

## Files

```
index.html        Page shell
css/style.css     All styling (light and dark themes)
js/questions.js   THE QUESTIONS: edit this to add, remove or reword questions
js/prompt.js      THE PROMPT: edit PROMPT_TEXT at the top to change what the AI is told
js/app.js         Rendering, navigation, validation, saving, copy/download
apps-script/access-codes.gs   Access-code checker that runs in a Google Sheet (optional)
```

## Publish on GitHub Pages (about 5 minutes)

1. Sign in to GitHub and create a new **public** repository, e.g. `myFuture`.
2. On the repository page choose **Add file → Upload files**, drag in everything from this folder (keep the `css` and `js` folders), and click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, set **Source** to *Deploy from a branch*, choose branch **main** and folder **/ (root)**, then **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/myFuture/`.

Every later commit to `main` republishes the site automatically.

**Custom domain (optional):** buy a domain, add it under Settings → Pages → Custom domain, and follow GitHub's DNS instructions. Tick *Enforce HTTPS*.

### Using git instead of the web uploader

```bash
cd myFuture
git init && git add . && git commit -m "myFuture Nigeria prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/myFuture.git
git push -u origin main
```

## Access codes (optional)

You can require students to enter an access code before they start. Each code has a maximum number of uses, and every attempt is logged with the time. Codes live in a Google Sheet you control. A code is used once it's accepted. After that the student's browser remembers it, so stopping and coming back on the same phone doesn't use it again. A different phone or browser counts as a new use. The **See an example** button works without a code.

**Set up (about 10 minutes):**

1. Create a new Google Sheet. Rename the first tab **Codes** and type these headers in row 1: `code`, `max_uses`, `uses`, `note`. Add one row per code, e.g. `STMARYS-7Q4K`, `120`, `0`, `St Mary's pilot`.
2. Add a second tab named **Log** with headers `timestamp`, `code`, `result` in row 1.
3. Choose **Extensions → Apps Script**. Delete what's in the editor, paste in all of `apps-script/access-codes.gs`, and click **Save**.
4. Click **Deploy → New deployment**. Click the gear next to *Select type* and choose **Web app**. Set *Execute as* to **Me** and *Who has access* to **Anyone**, then **Deploy**. Google asks you to authorise the script: choose your account, then *Advanced → Go to (project name)* → **Allow**.
5. Copy the **Web app URL** (it ends in `/exec`). In `js/questions.js`, paste it into `accessCheckUrl: "",` near the top, between the quotes, and publish the site.

**Managing codes:** add, change or remove rows in **Codes** at any time; changes take effect immediately. To allow more uses, raise `max_uses`. To switch a code off, set `max_uses` to `0`. Codes are matched ignoring capitals and spaces. Each check adds a row to **Log** with the result `accepted`, `used up` or `unknown`.

**Good to know:**
- Use codes that are hard to guess (mix letters and numbers, e.g. `STMARYS-7Q4K`), because anyone with the site can try codes.
- If you edit the script later, publish the change with **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL. A *New deployment* gives a new URL that you would have to paste into `questions.js` again.
- The code controls who can start the questionnaire. Someone technically skilled could still get round it by editing the page in their browser, but normal use is counted accurately.
- To turn codes off, set `accessCheckUrl` back to `""`.

## Test locally

Open `index.html` directly in a browser, or run a tiny server (recommended, so copy-to-clipboard behaves like the live site):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

On the first screen, **See an example with sample answers** fills in a fictional student and jumps to the review, so you can check the generated prompt without typing everything. Sample answers never overwrite a real student's saved progress.

## Customising

### Questions (`js/questions.js`)
Each section has a `title`, an `intro` and a list of `questions`. Supported types:

| type | use for | extra fields |
|---|---|---|
| `text`, `textarea`, `number` | free answers | `placeholder`, `min`, `max` |
| `select` | long single-choice lists (states) | `options` |
| `radio` | short single-choice lists | `options` |
| `checkbox` | multiple choice | `options`, `max`, `columns: 2` |
| `likert` | 1–5 rating grids | `items`, `scale` |
| `grades` | O'level subject + grade table | `subjects`, `grades`, `defaultRows` |

- `required: true` blocks the Next button until answered.
- `showIf: { id: "utme_status", in: ["Written, I have my score"] }` shows a question only for certain answers. `notIn` and `notEmpty` also work.
- Any checkbox option starting with "None" automatically clears the other choices.
- The **Interests** section is a short Holland (RIASEC) inventory: each item has a `tag` (R, I, A, S, E or C). The prompt includes the average per type and the top three-letter code. Keep three items per letter if you change it.
- Don't rename a question `id` after launch, or students' saved answers for it will be lost. Change `storageKey` if you make big changes and want everyone to start fresh.

### Prompt (`js/prompt.js`)
`PROMPT_TEXT` holds the fixed parts: the AI's role, background on Nigerian admissions, the tasks, and the rules. The student's answers are inserted in the middle, followed by language, length and "ask me questions first" instructions based on the last section. Test changes with the sample answers and paste the result into two or three different AIs to compare.

### Look
Colours and fonts are tokens at the top of `css/style.css`.

## Ideas for the next version

- **Pilot it.** Watch five or ten students use it on their own phones and note where they hesitate.
- **Counsellor mode.** A printable summary of answers that a school counsellor can discuss with the student.
- **Course data.** Add a small JSON file of courses with their UTME subject combinations (from the current JAMB brochure) so the site can flag mismatches itself before the AI sees them.
- **Optional anonymous analytics.** If you want to learn how students answer, add an opt-in "share my anonymous answers" button that posts to a Google Form or Supabase. That requires a privacy notice and consent under Nigeria's Data Protection Act (NDPA 2023).
- **Translations.** The interface is English; questions could be offered in Pidgin, Yoruba, Igbo and Hausa.

## Caveat

AI answers about cut-off marks, fees and subject requirements can be wrong and change yearly. The site and the prompt both tell students to confirm details in the official JAMB brochure and on each institution's website.
