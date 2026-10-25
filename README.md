# myFuture Nigeria

A free, private questionnaire that helps Nigerian secondary-school leavers choose a course of study and career. Students answer about 80 short questions (results, UTME subjects, strengths, interests, values, budget, family expectations). The site turns the answers into a single, well-structured prompt that they copy into ChatGPT, Claude, Gemini, Meta AI or Copilot to get personal advice.

- **No server, no database, no API keys.** Everything runs in the student's browser.
- **Private.** Answers are saved only in the student's own browser (localStorage) so they can stop and resume. Nothing is sent anywhere.
- **Access code.** Students enter an access code before they can start (see *Access code* below).
- **Phone-first and light.** Plain HTML, CSS and JavaScript; no frameworks or build step. About 65 KB plus two web fonts.

## Files

```
index.html        Page shell
css/style.css     All styling (light and dark themes)
js/questions.js   THE QUESTIONS: edit this to add, remove or reword questions
js/prompt.js      THE PROMPT: edit PROMPT_TEXT at the top to change what the AI is told
js/app.js         Rendering, navigation, validation, saving, copy/download, access-code check
tools/make-access-hash.js   Makes the hash for a new access code (not used by the site)
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

## Access code

Students must enter an access code on the first screen before they can start the questions or see the example. Capitals and spaces don't matter. The code is checked in the browser, so nothing is sent anywhere. Once the code is accepted, the browser remembers it, so a student who stops and comes back on the same phone isn't asked again. *Clear my answers* doesn't forget the code.

The code itself is **not** in the site's files or in this repository. `js/questions.js` holds only a salted, deliberately slow hash of it (`access`), so someone reading the source can't read the code off it. They would have to guess, and each guess takes a fraction of a second. The repository is public, so keep the code out of commit messages, issues and this README.

**Change the code** (needs [Node.js](https://nodejs.org/)):

```bash
node tools/make-access-hash.js NEW-CODE
```

Paste the three printed lines over the ones inside `access: { ... }` in `js/questions.js`, then publish. Devices that used the old code ask for the new one on their next visit. Their saved answers are kept.

**Turn the code off:** set `access: null` in `js/questions.js`.

**Limits:** the site has no server, so the check runs in the student's browser. A technically skilled student could get past it with the browser's developer tools, or by running their own copy of the public code. The code stops casual use and passing the link around. It is not real security. Choose a code that is hard to guess (avoid words or references people could work out), because guesses can be tested against the hash offline.

## Test locally

Open `index.html` directly in a browser, or run a tiny server (recommended, so copy-to-clipboard behaves like the live site):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

After you enter the access code, **See an example with sample answers** fills in a fictional student and jumps to the review, so you can check the generated prompt without typing everything. Sample answers never overwrite a real student's saved progress.

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
