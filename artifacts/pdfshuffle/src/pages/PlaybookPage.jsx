import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import LearningPrompt from "../Components/LearningPrompt";

const SITE_URL = "https://pdfshuffl.com";

const modules = [
  {
    number: "01",
    title: "Getting your bearings on PDFShuffl",
    lede:
      "Before you touch a single file, it helps to know where everything lives. This first lesson is for everyone, whether you grew up with paper forms or you have only ever known a touchscreen.",
    points: [
      "The top navigation bar is your map. Home introduces the tools, Tools opens the full workspace, Articles holds the written guides, and Playbook is the page you are reading now.",
      "Each tool has its own page with a clear name like Merge PDF or Compress PDF, so you always know what a button will do before you press it.",
      "On a phone the menu collapses into a small icon, usually three lines, in the top corner. Tap it to see the same links stacked in a list.",
      "Nothing on PDFShuffl is hidden behind a paywall just to look. You can read, browse and learn first, then act when you are ready.",
    ],
  },
  {
    number: "02",
    title: "How a PDF conversion actually works",
    lede:
      "Every conversion tool on the site follows the same three beat rhythm. Once you understand the pattern, you understand all of them.",
    points: [
      "Upload: you pick a file from your device, or drag it onto the drop zone. The tool reads the file into your browser session.",
      "Process: the tool does the work, for example turning a Word document into a PDF, or pulling pages out of a large file. A progress indicator shows it is busy.",
      "Download: when the work is finished, a download button appears. You save the new file back to your device, and the original is left untouched.",
      "If a step ever stalls, refresh the page and start again. Nothing is broken on your computer, the session simply restarts cleanly.",
    ],
  },
  {
    number: "03",
    title: "Choosing the right tool for the job",
    lede:
      "People often reach for the wrong tool because the names sound similar. Here is a plain language guide to the most common tasks.",
    points: [
      "Convert PDF to Word, Excel or PowerPoint when you need to edit the content again in Office.",
      "Convert Word, Excel or PowerPoint to PDF when you want a fixed, shareable copy that looks the same everywhere.",
      "Convert PDF to JPG or PNG when you need an image, and convert JPG or PNG to PDF when you want pictures bundled into one document.",
      "Compress PDF to shrink a file for email, merge PDF to join several files into one, and split PDF to break one file into smaller parts.",
      "Use OCR when a scanned page is just a picture of text and you want the words to become selectable and searchable.",
    ],
  },
  {
    number: "04",
    title: "Signing a document the simple way",
    lede:
      "Signing used to mean printing, scribbling and scanning. The signing tool removes all of that.",
    points: [
      "Open the signing tool and load the PDF that needs your signature.",
      "Create your mark once. You can type your name in a handwriting style, draw it with a mouse or finger, or upload a photo of a signature.",
      "Place the signature where it belongs by dragging it onto the right spot on the page.",
      "Download the signed PDF. The signature is now part of the file, ready to send back to whoever asked for it.",
    ],
  },
  {
    number: "05",
    title: "Keeping documents private and secure",
    lede:
      "Documents often hold personal details, so it is worth knowing the two protection tools and when to use them.",
    points: [
      "Password protect a PDF when you are about to share something sensitive and you want only the right person to open it.",
      "Unlock a PDF, using a password you already know, when a file is protected but you have permission and need to work with it.",
      "Share the password through a different channel from the file itself. Send the document by email, then text the password, for example.",
      "Files you upload are processed for your task only and are not put on public display. Treat your downloaded copy as the master version.",
    ],
  },
  {
    number: "06",
    title: "How signing in personalises your experience",
    lede:
      "You can use most tools without an account. Signing in adds a layer of convenience that follows you between devices.",
    points: [
      "When you sign in, the app can remember the tools you used most recently so they are one tap away next time.",
      "Your preferences travel with your account, so a setup on your laptop is waiting for you on your phone.",
      "Recent activity becomes a shortcut list, which saves hunting through the full tool grid every visit.",
      "You stay in control. Signing out stops the personalisation, and your saved preferences belong to you.",
    ],
  },
];

const cheatSheet = [
  {
    action: "Combine files",
    tool: "Merge PDF",
    cue: "Several files need to become one tidy document.",
  },
  {
    action: "Separate pages",
    tool: "Split PDF",
    cue: "One big file should become smaller, focused pieces.",
  },
  {
    action: "Make it smaller",
    tool: "Compress PDF",
    cue: "A file is too large to email or upload.",
  },
  {
    action: "Edit again",
    tool: "PDF to Word",
    cue: "You need to change the words inside a PDF.",
  },
  {
    action: "Lock it down",
    tool: "Protect PDF",
    cue: "Only the right person should be able to open it.",
  },
  {
    action: "Add your name",
    tool: "Sign PDF",
    cue: "A document is waiting for your signature.",
  },
  {
    action: "Turn into images",
    tool: "PDF to JPG",
    cue: "You need each page as a separate picture.",
  },
  {
    action: "Read scanned text",
    tool: "OCR",
    cue: "A scan is just a picture and you want real text.",
  },
];

const quizQuestions = [
  {
    q: "What are the three steps every conversion tool follows?",
    options: [
      "Print, sign, scan",
      "Upload, process, download",
      "Search, copy, paste",
      "Open, wait, refresh",
    ],
    answer: 1,
  },
  {
    q: "You want to edit the text inside a PDF again. Which tool fits?",
    options: [
      "Compress PDF",
      "Merge PDF",
      "PDF to Word",
      "Protect PDF",
    ],
    answer: 2,
  },
  {
    q: "What does Compress PDF do?",
    options: [
      "Joins files together",
      "Makes a file smaller",
      "Adds a password",
      "Turns pages into images",
    ],
    answer: 1,
  },
  {
    q: "When should you use OCR?",
    options: [
      "When a scan is a picture and you want selectable text",
      "When you want to email a large file",
      "When you need to sign a document",
      "When you want to split a file",
    ],
    answer: 0,
  },
  {
    q: "What does signing in to PDFShuffl give you?",
    options: [
      "Faster internet",
      "Free printing",
      "Saved recent tools and preferences across devices",
      "A new email address",
    ],
    answer: 2,
  },
  {
    q: "How should you share a password for a protected PDF?",
    options: [
      "In the same email as the file",
      "Printed on the document",
      "Through a different channel from the file",
      "Posted publicly",
    ],
    answer: 2,
  },
];

function MiniQuiz() {
  const [answers, setAnswers] = useState(Array(quizQuestions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce(
    (total, choice, index) =>
      choice === quizQuestions[index].answer ? total + 1 : total,
    0
  );
  const allAnswered = answers.every((choice) => choice !== null);

  function pick(questionIndex, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  function reset() {
    setAnswers(Array(quizQuestions.length).fill(null));
    setSubmitted(false);
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
        Check your understanding
      </p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Mini quiz: six quick questions
      </h3>
      <p className="mt-3 text-slate-600">
        Pick one answer per question, then submit to see your score. There is no
        time limit and no penalty for trying again.
      </p>

      <div className="mt-8 space-y-8">
        {quizQuestions.map((question, qIndex) => (
          <div key={qIndex}>
            <p className="font-black text-slate-900">
              {qIndex + 1}. {question.q}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, oIndex) => {
                const selected = answers[qIndex] === oIndex;
                const correct = question.answer === oIndex;
                let stateClass =
                  "border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-200 hover:bg-rose-50";
                if (submitted) {
                  if (correct) {
                    stateClass =
                      "border-emerald-300 bg-emerald-50 text-emerald-800";
                  } else if (selected) {
                    stateClass = "border-rose-300 bg-rose-50 text-rose-700";
                  } else {
                    stateClass = "border-slate-200 bg-white text-slate-500";
                  }
                } else if (selected) {
                  stateClass = "border-rose-400 bg-rose-50 text-rose-700";
                }
                return (
                  <button
                    key={oIndex}
                    type="button"
                    onClick={() => pick(qIndex, oIndex)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${stateClass}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit answers
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-rose-200 hover:text-rose-600"
          >
            Try again
          </button>
        )}
        {!submitted && !allAnswered && (
          <span className="text-sm font-bold text-slate-400">
            Answer every question to unlock your score.
          </span>
        )}
        {submitted && (
          <span className="text-lg font-black text-slate-900">
            You scored {score} out of {quizQuestions.length}.
          </span>
        )}
      </div>
    </div>
  );
}

export default function PlaybookPage() {
  const canonical = `${SITE_URL}/playbook`;
  const title = "PDF Playbook: Learn Every Tool Step by Step | PDFShuffl";
  const description =
    "A friendly mini course for all ages. Learn how to navigate PDFShuffl, how conversion works, how to sign documents, and how signing in personalises your experience.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: "PDFShuffl Playbook",
        url: canonical,
        description,
        learningResourceType: "Course",
        educationalLevel: "Beginner",
        publisher: { "@type": "Organization", name: "PDFShuffl", url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "PDFShuffl", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Playbook", item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <header className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
            The PDFShuffl Playbook
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950">
            A mini course in working with PDFs
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            This playbook is written for everyone, from someone opening their
            first document tool to a student who lives on their phone. Work
            through the lessons in order, or jump to the one you need. Each module
            is short, plain spoken and built around things you will actually do.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#modules"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500"
            >
              Start the lessons
            </a>
            <a
              href="#cheat-sheet"
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              Jump to cheat sheet
            </a>
            <a
              href="#quiz"
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              Take the quiz
            </a>
          </div>
        </header>

        <section id="modules" className="mt-14 scroll-mt-24">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
              Lessons
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Six modules, start to finish
            </h2>
            <p className="mt-3 text-slate-600">
              Read top to bottom for the full picture, or pick the module that
              answers your question right now.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {modules.map((module) => (
              <article
                key={module.number}
                className="flex flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-7"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-rose-500 text-lg font-black text-white">
                    {module.number}
                  </span>
                  <h3 className="text-xl font-black leading-snug text-slate-950">
                    {module.title}
                  </h3>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{module.lede}</p>
                <ul className="mt-4 space-y-2 pl-1">
                  {module.points.map((point, index) => (
                    <li
                      key={index}
                      className="flex gap-3 leading-7 text-slate-700"
                    >
                      <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-rose-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="cheat-sheet" className="mt-16 scroll-mt-24">
          <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-400">
              Cheat sheet
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Find the right tool at a glance
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Match what you want to do on the left with the tool that does it.
              Keep this card handy until the names feel second nature.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cheatSheet.map((card) => (
                <div
                  key={card.tool}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-300">
                    {card.action}
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {card.tool}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {card.cue}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-rose-500 p-5">
                <p className="text-2xl font-black">1. Upload</p>
                <p className="mt-2 text-sm leading-6 text-rose-50">
                  Pick or drag your file into the tool.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-rose-500 p-5">
                <p className="text-2xl font-black">2. Process</p>
                <p className="mt-2 text-sm leading-6 text-rose-50">
                  Let the tool do the work while you wait.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-rose-500 p-5">
                <p className="text-2xl font-black">3. Download</p>
                <p className="mt-2 text-sm leading-6 text-rose-50">
                  Save your finished file back to your device.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="quiz" className="mt-16 scroll-mt-24">
          <MiniQuiz />
        </section>

        <section className="mt-12">
          <LearningPrompt topic="playbook" />
        </section>

        <section className="mt-12 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Ready to put the playbook into practice?
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            You have the map and the method. Open the workspace and try a tool, or
            read a deeper guide in the knowledge library.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/tools"
              className="rounded-full bg-rose-500 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600"
            >
              Open the tools
            </Link>
            <Link
              to="/articles"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-rose-200 hover:text-rose-600"
            >
              Read the guides
            </Link>
            <Link
              to="/"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-rose-200 hover:text-rose-600"
            >
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
