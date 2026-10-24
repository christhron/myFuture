/*
 * Course Compass — questionnaire definition
 * ------------------------------------------------------------
 * Edit this file to change the questions. No other file needs to change.
 *
 * Question types:
 *   text, textarea, number, select, radio, checkbox, likert, grades
 *
 * Common fields:
 *   id        unique key (used in saved answers; don't rename after launch)
 *   type      one of the types above
 *   label     the question text
 *   help      optional hint under the label
 *   required  true/false
 *   options   for select/radio/checkbox: array of strings
 *   max       for checkbox: max number of choices; for number: max value
 *   min       for number: min value
 *   showIf    { id: "otherQuestionId", in: ["value", ...] }  or  { id, notEmpty: true }
 *   promptLabel  optional shorter label used in the AI prompt
 */

(function () {
  const STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
    "Taraba", "Yobe", "Zamfara", "Outside Nigeria"
  ];

  const OLEVEL_SUBJECTS = [
    "English Language", "Mathematics", "Further Mathematics", "Civic Education",
    "Physics", "Chemistry", "Biology", "Agricultural Science", "Geography",
    "Economics", "Government", "Literature in English", "History",
    "Christian Religious Studies", "Islamic Studies",
    "Commerce", "Financial Accounting", "Office Practice", "Marketing", "Insurance",
    "Data Processing", "Computer Studies", "Technical Drawing", "Visual Art",
    "Music", "French", "Arabic", "Yoruba", "Igbo", "Hausa",
    "Home Management", "Food and Nutrition", "Clothing and Textiles",
    "Physical and Health Education", "Animal Husbandry", "Fisheries",
    "Basic Electricity", "Auto Mechanics", "Building Construction",
    "Catering Craft Practice", "Other"
  ];

  // UTME subjects other than Use of English (which is compulsory)
  const UTME_SUBJECTS = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science",
    "Geography", "Economics", "Government", "Literature in English", "History",
    "Christian Religious Studies", "Islamic Studies", "Commerce",
    "Principles of Accounts", "Computer Studies", "Fine Art", "Music",
    "French", "Arabic", "Yoruba", "Igbo", "Hausa", "Home Economics",
    "Physical and Health Education"
  ];

  const SCHOOL_SUBJECTS = OLEVEL_SUBJECTS.filter(s => s !== "Other");

  const GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9", "Awaiting result"];

  const AGREE5 = ["Not at all", "A little", "Somewhat", "Quite a lot", "Very much"];

  window.COURSE_COMPASS = {
    version: "0.1",
    storageKey: "course-compass.v1",
    lists: { STATES, OLEVEL_SUBJECTS, UTME_SUBJECTS, GRADES },

    sections: [
      // ------------------------------------------------------------------
      {
        id: "about",
        title: "About you",
        intro: "A few basics so the advice fits your situation. You don't need to give your full name.",
        questions: [
          { id: "first_name", type: "text", label: "First name or nickname", help: "Optional. It only appears in your prompt.", placeholder: "e.g. Tobi" },
          { id: "age", type: "number", label: "How old are you?", required: true, min: 12, max: 35 },
          { id: "gender", type: "radio", label: "Gender", options: ["Female", "Male", "Prefer not to say"] },
          { id: "state_residence", type: "select", label: "Which state do you live in now?", required: true, options: STATES },
          { id: "state_origin", type: "select", label: "State of origin", help: "Some state universities give admission preference to indigenes.", options: STATES },
          {
            id: "stage", type: "radio", label: "Where are you right now?", required: true,
            options: [
              "Still in SS3",
              "Finished secondary school, waiting for WAEC/NECO results",
              "Have my results, preparing for UTME",
              "Wrote UTME, waiting for admission",
              "Gap year or working",
              "Already in a tertiary institution, thinking of changing course"
            ]
          },
          { id: "current_course", type: "text", label: "What course and institution are you in now?", showIf: { id: "stage", in: ["Already in a tertiary institution, thinking of changing course"] } },
          { id: "stream", type: "radio", label: "Which class were you in during senior secondary?", required: true, options: ["Science", "Commercial / Business", "Arts / Humanities", "Technical", "Mixed / not streamed"] },
          { id: "school_type", type: "radio", label: "What kind of secondary school did you attend?", options: ["Public (government)", "Private", "Mission / religious", "Federal Government College (Unity School)", "Other"] }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "academics",
        title: "Your results",
        intro: "Results decide which courses you can be admitted into, so the AI needs to see them. Enter what you have; leave the rest.",
        questions: [
          { id: "olevel_exams", type: "checkbox", label: "Which O'level exams have you written?", required: true, options: ["WAEC (WASSCE)", "NECO (SSCE)", "NABTEB", "GCE", "None yet"] },
          { id: "olevel_sittings", type: "radio", label: "How many sittings?", options: ["One sitting", "Two sittings", "More than two"], showIf: { id: "olevel_exams", notIn: ["None yet"], notEmpty: true } },
          {
            id: "grades", type: "grades", label: "Your O'level grades",
            help: "Add each subject and your best grade. Use 'Awaiting result' if you haven't received it yet.",
            subjects: OLEVEL_SUBJECTS, grades: GRADES,
            defaultRows: ["English Language", "Mathematics"],
            showIf: { id: "olevel_exams", notIn: ["None yet"], notEmpty: true }
          },
          {
            id: "utme_status", type: "radio", label: "UTME (JAMB) status", required: true,
            options: ["Not registered yet", "Registered, haven't written it", "Written, I have my score", "Not planning to write UTME"]
          },
          {
            id: "utme_subjects", type: "checkbox", label: "Your UTME subjects (besides Use of English)",
            help: "Choose exactly three, or the three you plan to register.", options: UTME_SUBJECTS, max: 3, columns: 2,
            showIf: { id: "utme_status", in: ["Not registered yet", "Registered, haven't written it", "Written, I have my score"] }
          },
          { id: "utme_score", type: "number", label: "UTME score (out of 400)", min: 0, max: 400, showIf: { id: "utme_status", in: ["Written, I have my score"] } },
          { id: "other_quals", type: "checkbox", label: "Other qualifications or programmes", options: ["JUPEB", "IJMB", "A-Levels / Cambridge", "OND / ND", "NCE", "Pre-degree / remedial", "SAT / international exam", "None"] },
          { id: "fav_subjects", type: "checkbox", label: "Which subjects do you enjoy most?", help: "Up to three.", options: SCHOOL_SUBJECTS, max: 3, columns: 2, required: true },
          { id: "hard_subjects", type: "checkbox", label: "Which subjects do you find hardest or enjoy least?", help: "Up to three.", options: SCHOOL_SUBJECTS, max: 3, columns: 2 }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "strengths",
        title: "Strengths",
        intro: "Rate yourself honestly. Nobody is good at everything, and that's the point.",
        questions: [
          {
            id: "skills", type: "likert", label: "How good are you at each of these?", required: true,
            scale: ["Weak", "Below average", "Average", "Good", "Very good"],
            promptLabel: "Self-rated skills (1 = weak, 5 = very good)",
            items: [
              { id: "numbers", text: "Working with numbers and calculations" },
              { id: "writing", text: "Writing essays, stories or reports" },
              { id: "speaking", text: "Speaking in front of people" },
              { id: "science", text: "Understanding how science works" },
              { id: "design", text: "Drawing, design or visual creativity" },
              { id: "hands", text: "Fixing or building things with my hands" },
              { id: "computers", text: "Using computers, phones and apps; coding" },
              { id: "leading", text: "Leading or organising people" },
              { id: "caring", text: "Listening to and helping people with problems" },
              { id: "selling", text: "Buying, selling and spotting business chances" },
              { id: "languages", text: "Learning languages" },
              { id: "memory", text: "Memorising lots of information" }
            ]
          },
          { id: "proud", type: "textarea", label: "Something you did that you're proud of", help: "School project, competition, business, helping family, anything.", placeholder: "e.g. I repaired phones for neighbours during the holidays." }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "interests",
        title: "Interests",
        intro: "How much would you enjoy each activity? Ignore whether you have the skills yet, and whether it pays well.",
        questions: [
          {
            id: "riasec", type: "likert", label: "How much would you enjoy…", required: true,
            scale: AGREE5,
            promptLabel: "Interest ratings (1 = not at all, 5 = very much)",
            items: [
              { id: "r1", tag: "R", text: "Repairing a generator, motorcycle or phone" },
              { id: "r2", tag: "R", text: "Building or constructing something" },
              { id: "r3", tag: "R", text: "Working outdoors: on a farm, building site or in the field" },
              { id: "i1", tag: "I", text: "Doing experiments in a laboratory" },
              { id: "i2", tag: "I", text: "Solving hard maths or logic puzzles" },
              { id: "i3", tag: "I", text: "Finding out why something happens, like how a disease spreads" },
              { id: "a1", tag: "A", text: "Drawing, designing or making videos" },
              { id: "a2", tag: "A", text: "Writing stories, poems, songs or articles" },
              { id: "a3", tag: "A", text: "Acting, music, photography or fashion" },
              { id: "s1", tag: "S", text: "Teaching or tutoring younger students" },
              { id: "s2", tag: "S", text: "Caring for sick or elderly people" },
              { id: "s3", tag: "S", text: "Helping a friend through a personal problem" },
              { id: "e1", tag: "E", text: "Starting and running my own business" },
              { id: "e2", tag: "E", text: "Leading a group, like being a prefect or club president" },
              { id: "e3", tag: "E", text: "Persuading people, negotiating or selling" },
              { id: "c1", tag: "C", text: "Keeping accurate records or accounts" },
              { id: "c2", tag: "C", text: "Organising files, data or schedules" },
              { id: "c3", tag: "C", text: "Checking work carefully for mistakes" }
            ]
          }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "values",
        title: "What matters to you",
        intro: "Different careers reward different things. Pick what you care about most.",
        questions: [
          {
            id: "values", type: "checkbox", label: "What matters most in your future work?", help: "Choose your top three.", required: true, max: 3,
            options: [
              "High income", "Job security", "Helping people directly", "Respect and status",
              "Creativity", "Being my own boss", "Work-life balance", "Chance to work abroad",
              "Solving Nigeria's problems", "Getting a job quickly after school", "Learning and research", "Travel and variety"
            ]
          },
          { id: "environment", type: "radio", label: "Where would you most like to work?", required: true, options: ["Office", "Outdoors / in the field", "Hospital, clinic or lab", "Factory, workshop or site", "Studio or creative space", "From home / remote", "A mix"] },
          { id: "people", type: "radio", label: "Do you prefer working…", options: ["Mostly with people", "Mostly with data, ideas or computers", "Mostly with tools, machines or materials", "A mix"] },
          { id: "risk", type: "radio", label: "Which sounds more like you?", options: ["I want a steady salary, even if it's smaller", "I'd take a risk for the chance of earning much more", "Not sure"] },
          { id: "sector", type: "checkbox", label: "Sectors that interest you", help: "Optional. Choose any.", columns: 2, options: ["Tech and software", "Health and medicine", "Banking and finance", "Oil, gas and energy", "Renewable energy", "Agriculture and agribusiness", "Law and justice", "Media, film and music (Nollywood, Afrobeats)", "Fashion and design", "Education", "Engineering and construction", "Government and public service", "NGOs and development", "Trading and entrepreneurship", "Aviation and maritime", "Military and security", "Sports"] }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "circumstances",
        title: "Your circumstances",
        intro: "Money, distance and family shape what's realistic. Being honest here makes the advice more useful.",
        questions: [
          {
            id: "budget", type: "radio", label: "Roughly how much can your family afford for school fees per year?", required: true,
            help: "School fees only, not accommodation or feeding.",
            options: ["Under ₦100,000", "₦100,000 – ₦300,000", "₦300,000 – ₦1 million", "₦1 million – ₦3 million", "Over ₦3 million", "Not sure"]
          },
          { id: "support", type: "checkbox", label: "Would you need any of these?", options: ["Scholarship or bursary", "Student loan (NELFUND)", "To work while studying", "None of these"] },
          { id: "institutions", type: "checkbox", label: "Which institutions would you consider?", required: true, options: ["Federal university", "State university", "Private university", "Polytechnic", "College of education", "Specialised college (nursing, agriculture, aviation, etc.)", "Study abroad", "Not sure"] },
          { id: "location", type: "radio", label: "How far from home are you willing to study?", required: true, options: ["Must stay in my state", "My region of Nigeria", "Anywhere in Nigeria", "Anywhere, including abroad"] },
          { id: "duration", type: "radio", label: "How long are you willing to study?", required: true, options: ["As short as possible (2–4 years)", "4–5 years is fine", "6+ years is fine (e.g. medicine, architecture)"] },
          { id: "family_pref", type: "radio", label: "Does your family expect you to study a particular course?", required: true, options: ["Yes, strongly", "They have a preference but it's my choice", "No, it's up to me"] },
          { id: "family_course", type: "text", label: "Which course do they prefer?", showIf: { id: "family_pref", in: ["Yes, strongly", "They have a preference but it's my choice"] } },
          { id: "family_feel", type: "radio", label: "How do you feel about that course?", showIf: { id: "family_pref", in: ["Yes, strongly", "They have a preference but it's my choice"] }, options: ["I want it too", "I'm unsure", "I don't want it"] },
          { id: "abroad", type: "radio", label: "Do you hope to work outside Nigeria someday?", options: ["Yes, definitely", "Maybe", "No, I want to build my career in Nigeria", "Not sure"] },
          { id: "devices", type: "checkbox", label: "What do you have regular access to?", help: "Some careers need a laptop or steady internet to practise.", options: ["Smartphone", "Laptop or desktop", "Regular internet data", "Steady electricity", "None of these"] },
          { id: "health", type: "textarea", label: "Any health needs or disability the advice should consider?", help: "Optional. Only include what you're comfortable sharing." }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "ideas",
        title: "Your ideas",
        intro: "Last section about you. Short answers are fine.",
        questions: [
          { id: "considering", type: "textarea", label: "Which courses or careers are you already considering?", placeholder: "e.g. Medicine, Computer Science, maybe Law" },
          { id: "ruled_out", type: "textarea", label: "Anything you definitely don't want to do? Why?", placeholder: "e.g. Not accounting, I find it boring" },
          { id: "role_models", type: "textarea", label: "Whose work do you admire?", help: "Someone you know, or someone famous." },
          { id: "dream", type: "textarea", label: "If money and grades didn't matter, what would you do?" },
          { id: "worry", type: "textarea", label: "What worries you most about choosing a course?" },
          { id: "extra", type: "textarea", label: "Anything else the adviser should know?" }
        ]
      },

      // ------------------------------------------------------------------
      {
        id: "settings",
        title: "Your AI report",
        intro: "Choose how you want the AI to answer you.",
        questions: [
          { id: "ai_tool", type: "radio", label: "Which AI will you use?", required: true, options: ["ChatGPT", "Claude", "Gemini", "Meta AI (WhatsApp, Instagram, Facebook)", "Microsoft Copilot", "Other"] },
          { id: "answer_lang", type: "radio", label: "Answer language", required: true, options: ["English", "Simple English", "Nigerian Pidgin", "Yoruba", "Igbo", "Hausa"] },
          { id: "detail", type: "radio", label: "How detailed?", required: true, options: ["Short and to the point", "Detailed"] },
          { id: "followup", type: "radio", label: "Should the AI ask you questions first?", required: true, options: ["Yes, ask me up to 5 questions before recommending", "No, give me recommendations straight away"] }
        ]
      }
    ],

    // Example answers for the "See an example with sample answers" button. Fictional student.
    sample: {
      first_name: "Amaka", age: 17, gender: "Female", state_residence: "Enugu", state_origin: "Anambra",
      stage: "Have my results, preparing for UTME", stream: "Science", school_type: "Private",
      olevel_exams: ["WAEC (WASSCE)", "NECO (SSCE)"], olevel_sittings: "One sitting",
      grades: [
        { subject: "English Language", grade: "B3" }, { subject: "Mathematics", grade: "A1" },
        { subject: "Physics", grade: "B2" }, { subject: "Chemistry", grade: "C4" },
        { subject: "Biology", grade: "B3" }, { subject: "Further Mathematics", grade: "B2" },
        { subject: "Civic Education", grade: "A1" }, { subject: "Geography", grade: "C5" },
        { subject: "Computer Studies", grade: "A1" }
      ],
      utme_status: "Registered, haven't written it", utme_subjects: ["Mathematics", "Physics", "Chemistry"],
      other_quals: ["None"], fav_subjects: ["Mathematics", "Computer Studies", "Physics"], hard_subjects: ["Biology", "Literature in English"],
      skills: { numbers: 5, writing: 3, speaking: 2, science: 4, design: 3, hands: 3, computers: 5, leading: 3, caring: 2, selling: 3, languages: 2, memory: 3 },
      proud: "I built a simple website for my uncle's provisions shop using free tools.",
      riasec: { r1: 4, r2: 4, r3: 2, i1: 3, i2: 5, i3: 4, a1: 4, a2: 2, a3: 2, s1: 3, s2: 1, s3: 3, e1: 4, e2: 2, e3: 2, c1: 3, c2: 4, c3: 3 },
      values: ["High income", "Chance to work abroad", "Creativity"], environment: "A mix", people: "Mostly with data, ideas or computers",
      risk: "I'd take a risk for the chance of earning much more", sector: ["Tech and software", "Renewable energy"],
      budget: "₦100,000 – ₦300,000", support: ["Scholarship or bursary"], institutions: ["Federal university", "State university", "Polytechnic"],
      location: "Anywhere in Nigeria", duration: "4–5 years is fine", family_pref: "Yes, strongly", family_course: "Medicine and Surgery", family_feel: "I don't want it",
      abroad: "Maybe", devices: ["Smartphone", "Regular internet data"],
      considering: "Computer Science or Electrical/Electronic Engineering", ruled_out: "Medicine. I don't like blood and Biology is my weakest science.",
      role_models: "Iyinoluwa Aboyeji (tech founder); my cousin who is a software developer in Lagos", dream: "Build apps that help small traders in my market.",
      worry: "My parents want Medicine and I don't know how to tell them. Also worried I won't get the cut-off mark.",
      extra: "I'm the first in my family to go to university. Light is often off at home, so I study at my aunt's shop in the evenings.",
      ai_tool: "ChatGPT", answer_lang: "English", detail: "Detailed", followup: "No, give me recommendations straight away"
    }
  };
})();
