import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FilePlus2,
  Wand2,
  UploadCloud,
  Download,
  LockKeyhole,
  PenLine,
  Image,
  Presentation,
  Code2,
  Table,
  Type,
  Scissors,
  Minimize2,
  MessageSquareText,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Globe2,
  Users,
  BriefcaseBusiness,
  GraduationCap,
  Building2,
  Smartphone,
  Laptop,
  MonitorSmartphone,
  CheckCircle2,
  Info,
  Mail,
  Map,
} from "lucide-react";

const toolGroups = [
  {
    title: "Create & Build",
    tools: [
      { name: "Create PDF", icon: FilePlus2, accepts: ".txt,.jpg,.jpeg,.png", description: "Create a fresh PDF from text, images, notes, or scanned material." },
      { name: "Format PDF", icon: Wand2, accepts: ".pdf", description: "Prepare page size, layout, margins, order, and presentation style." },
      { name: "Edit PDF", icon: PenLine, accepts: ".pdf", description: "Add text, markups, highlights, images, shapes, and document notes." },
      { name: "PDF Comments", icon: MessageSquareText, accepts: ".pdf", description: "Review documents with comments, replies, highlights, and approval notes." },
    ],
  },
  {
    title: "Office to PDF",
    tools: [
      { name: "Word/Libre to PDF", icon: FileText, accepts: ".doc,.docx,.odt,.ott", description: "Convert Microsoft Word and LibreOffice Writer files into clean PDFs." },
      { name: "Libre to PDF", icon: FileText, accepts: ".odt,.ods,.odp", description: "Convert LibreOffice Writer, Calc, or Impress files into PDF format." },
      { name: "PPT to PDF", icon: Presentation, accepts: ".ppt,.pptx,.odp", description: "Turn slide decks into sharable, locked-layout PDF documents." },
      { name: "CSV to PDF", icon: Table, accepts: ".csv", description: "Convert spreadsheets and tabular data into readable PDF reports." },
      { name: "TXT to PDF", icon: Type, accepts: ".txt", description: "Convert plain text files into polished PDF pages." },
    ],
  },
  {
    title: "PDF to Editable Formats",
    tools: [
      { name: "PDF to Word", icon: FileText, accepts: ".pdf", description: "Extract PDF content into an editable Word-style document." },
      { name: "PDF to Libre", icon: FileText, accepts: ".pdf", description: "Convert PDF content into LibreOffice-friendly editable files." },
      { name: "PDF to Editable PDF", icon: Wand2, accepts: ".pdf", description: "Make scanned or flat PDFs searchable, fillable, and easier to edit." },
      { name: "PDF to HTML", icon: Code2, accepts: ".pdf", description: "Convert PDF content into structured web-ready HTML." },
      { name: "PDF to CSV", icon: Table, accepts: ".pdf", description: "Extract tables and rows from PDF into CSV data." },
      { name: "PDF to TXT", icon: Type, accepts: ".pdf", description: "Extract readable text from PDF into plain text format." },
    ],
  },
  {
    title: "Web, Image & Secure Workflows",
    tools: [
      { name: "JPG to PDF", icon: Image, accepts: ".jpg,.jpeg,.png", description: "Combine images into one tidy PDF for sharing or archiving." },
      { name: "HTML to PDF", icon: Code2, accepts: ".html,.htm", description: "Convert web pages, invoices, and HTML layouts into PDF." },
      { name: "Sign PDF", icon: PenLine, accepts: ".pdf", description: "Apply a simple typed or drawn signature workflow to your PDF." },
      { name: "Sign a Locked PDF", icon: LockKeyhole, accepts: ".pdf", description: "Start a secure signing request for PDFs that require permission handling." },
      { name: "Request Signing", icon: ShieldCheck, accepts: ".pdf", description: "Send a document for review and signature with recipient details." },
      { name: "Crop PDF", icon: Scissors, accepts: ".pdf", description: "Trim page edges, remove excess whitespace, and prepare final layouts." },
      { name: "Compress PDF", icon: Minimize2, accepts: ".pdf", description: "Reduce PDF file size for email, portals, mobile sharing, or storage." },
    ],
  },
];

const allTools = toolGroups.flatMap((g) => g.tools);

const educationCards = [
  {
    question: "What is a PDF?",
    answer: "A Portable Document Format keeps text, images, layout, signatures, forms, and pages consistent across devices.",
    icon: FileText,
    link: "https://www.adobe.com/za/acrobat/about-adobe-pdf.html",
  },
  {
    question: "Why use PDF?",
    answer: "PDF is ideal when your document must look professional, travel safely, and remain readable on phones, tablets, laptops, and PCs.",
    icon: Globe2,
    link: "https://www.loc.gov/preservation/digital/formats/",
  },
  {
    question: "Why is PDF important?",
    answer: "PDF is used for contracts, forms, certificates, invoices, policies, statements, schoolwork, identity documents, and long-term records.",
    icon: ShieldCheck,
    link: "https://pdfa.org/",
  },
  {
    question: "Why make PDF easy?",
    answer: "Simple tools save time, reduce errors, and help everyone complete document work without needing technical skills.",
    icon: Sparkles,
    link: "https://www.adobe.com/za/acrobat/resources.html",
  },
  {
    question: "Where to use PDF?",
    answer: "Use PDF at school, work, home, bank branches, government portals, HR onboarding, applications, legal workflows, and customer service desks.",
    icon: Building2,
    link: "https://www.loc.gov/preservation/resources/rfs/",
  },
  {
    question: "How to use PDF?",
    answer: "Upload, convert, edit, sign, compress, comment, crop, download, and share from one clean workspace.",
    icon: MonitorSmartphone,
    link: "https://pdfa.org/resource/iso-32000-pdf/",
  },
];

const audiences = [
  { icon: Users, title: "Everyone", text: "For students, parents, entrepreneurs, employees, consultants, teachers, and public users." },
  { icon: BriefcaseBusiness, title: "Business teams", text: "Prepare tenders, contracts, reports, proposals, invoices, and compliance packs." },
  { icon: GraduationCap, title: "Education", text: "Submit assignments, combine notes, compress files, and sign forms quickly." },
  { icon: Building2, title: "Branches & service desks", text: "Support walk-in document needs across mobile, tablet, touchscreen, laptop, and PC." },
];

const pages = ["Home", "About", "Tools", "Privacy Policy", "Terms and Conditions", "Contact", "Sitemap"];

function downloadTextFile(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function createSimplePdf(text) {
  const safeText = (text || "Created with PDFy").replace(/[()\\]/g, "\\$&").slice(0, 2500);
  const content = `BT /F1 18 Tf 72 760 Td (PDFy Document) Tj /F1 11 Tf 0 -32 Td (${safeText}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj + "\n";
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += String(offset).padStart(10, "0") + " 00000 n \n";
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "PDFy-created-document.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Header({ activePage, setActivePage, selectedTool, setSelectedTool }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  const nav = (
    <>
      {pages.map((page) => (
        page === "Tools" ? (
          <div key={page} className="relative group">
            <button onClick={() => setOpen(!open)} className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${activePage === "Tools" ? "bg-rose-50 text-rose-600" : "text-slate-700 hover:bg-slate-100"}`}>
              Tools <ChevronDown size={16} />
            </button>
            <div className={`${open ? "block" : "hidden"} group-hover:block absolute left-0 top-11 z-50 w-[740px] max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl`}>
              <div className="grid gap-4 md:grid-cols-2">
                {toolGroups.map((group) => (
                  <div key={group.title}>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{group.title}</h4>
                    <div className="grid gap-1">
                      {group.tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button key={tool.name} onClick={() => { setActivePage("Tools"); setSelectedTool(tool.name); setOpen(false); setMobile(false); }} className="flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50">
                            <span className="rounded-xl bg-rose-50 p-2 text-rose-600"><Icon size={18} /></span>
                            <span><span className="block text-sm font-bold text-slate-800">{tool.name}</span><span className="line-clamp-1 text-xs text-slate-500">{tool.description}</span></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button key={page} onClick={() => { setActivePage(page); setMobile(false); }} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activePage === page ? "bg-rose-50 text-rose-600" : "text-slate-700 hover:bg-slate-100"}`}>{page}</button>
        )
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <button onClick={() => setActivePage("Home")} className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-200"><FileText /></span>
          <span className="text-2xl font-black tracking-tight text-slate-950">PDFy<span className="text-rose-500">.</span></span>
        </button>
        <nav className="hidden items-center gap-1 lg:flex">{nav}</nav>
        <button onClick={() => setActivePage("Tools")} className="hidden rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-200 lg:block">Start converting</button>
        <button onClick={() => setMobile(!mobile)} className="rounded-2xl border border-slate-200 p-3 lg:hidden">{mobile ? <X /> : <Menu />}</button>
      </div>
      {mobile && <div className="border-t border-slate-100 bg-white px-4 pb-4 lg:hidden"><div className="grid gap-2">{nav}</div></div>}
    </header>
  );
}

function Hero({ setActivePage }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff1f2,transparent_38%),linear-gradient(180deg,#ffffff,#f8fafc)]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-bold text-rose-600 shadow-sm"><Sparkles size={16} /> Premium document work, made effortless</div>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">Create, convert, edit, sign and compress PDFs in one sleek workspace.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">PDFy brings everyday document work into a fast, elegant experience for mobile phones, tablets, touchscreen displays, laptops and PCs.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setActivePage("Tools")} className="rounded-full bg-rose-500 px-7 py-4 text-base font-black text-white shadow-xl shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-600">Choose a PDF tool</button>
            <button onClick={() => document.getElementById("learn")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-800 shadow-sm">Learn why PDF matters</button>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm font-bold text-slate-600">
            <span className="flex items-center gap-2"><Smartphone size={18} /> Mobile</span>
            <span className="flex items-center gap-2"><MonitorSmartphone size={18} /> Touchscreen</span>
            <span className="flex items-center gap-2"><Laptop size={18} /> Desktop</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-rose-200 to-orange-100 blur-3xl" />
          <div className="relative rounded-[2.5rem] border border-white bg-white/90 p-4 shadow-2xl">
            <div className="rounded-[2rem] bg-slate-950 p-5 text-white">
              <div className="mb-5 flex items-center justify-between"><span className="font-black">PDFy Tools</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">Live workspace</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {allTools.slice(0, 8).map((tool) => {
                  const Icon = tool.icon;
                  return <div key={tool.name} className="rounded-3xl bg-white/10 p-4 backdrop-blur"><Icon className="mb-3 text-rose-300" /><p className="font-bold">{tool.name}</p><p className="mt-1 text-xs text-slate-300">Upload • Process • Download</p></div>;
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Home({ setActivePage }) {
  return (
    <main>
      <Hero setActivePage={setActivePage} />
      <section id="learn" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-10 max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">PDF knowledge hub</p><h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Understand the what, why, when, where and how of PDF.</h2><p className="mt-4 text-slate-600">Each thumbnail opens a reliable educational resource in a new tab, so users stay in PDFy while learning from trusted sources.</p></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {educationCards.map((card) => {
            const Icon = card.icon;
            return (
              <a key={card.question} href={card.link} target="_blank" rel="noreferrer" className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-500 group-hover:text-white"><Icon size={30} /></div>
                <h3 className="text-xl font-black text-slate-950">{card.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.answer}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-rose-600">Open educational source <ArrowRight size={16} /></span>
              </a>
            );
          })}
        </div>
      </section>
      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-sm font-black uppercase tracking-[0.2em] text-rose-300">Built for every document moment</p><h2 className="mt-3 text-4xl font-black">Why people will return to PDFy.</h2><p className="mt-4 text-slate-300">One home for applications, school submissions, customer forms, HR packs, contracts, reports, statements, invoices, branch support, travel documents, and signed approvals.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {audiences.map((item) => {
                const Icon = item.icon;
                return <div key={item.title} className="rounded-[2rem] bg-white/10 p-6"><Icon className="mb-4 text-rose-300" /><h3 className="font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p></div>;
              })}
            </div>
          </div>
        </div>
      </section>
      <ToolShowcase setActivePage={setActivePage} />
    </main>
  );
}

function ToolShowcase({ setActivePage }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">All-in-one tools</p><h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Everything PDF, logically organised.</h2></div><button onClick={() => setActivePage("Tools")} className="rounded-full bg-slate-950 px-6 py-3 font-black text-white">Open tools</button></div>
      <div className="grid gap-5 lg:grid-cols-4">
        {toolGroups.map((group) => <div key={group.title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 font-black text-slate-950">{group.title}</h3><div className="grid gap-2">{group.tools.map((tool) => { const Icon = tool.icon; return <div key={tool.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><Icon size={18} className="text-rose-500" /><span className="text-sm font-bold text-slate-700">{tool.name}</span></div>; })}</div></div>)}
      </div>
    </section>
  );
}

function ToolsPage({ selectedTool, setSelectedTool }) {
  const tool = allTools.find((t) => t.name === selectedTool) || allTools[0];
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("This document was created inside PDFy. Replace this text with your content, notes, instructions, or form details.");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("Ready");
  const inputRef = useRef(null);

  function processTool() {
    if (tool.name === "Create PDF") {
      createSimplePdf(note);
      setStatus("A simple PDF was created and downloaded.");
      return;
    }
    if (tool.name === "TXT to PDF" && file) {
      const reader = new FileReader();
      reader.onload = () => createSimplePdf(String(reader.result || note));
      reader.readAsText(file);
      setStatus("Your text file was converted into a simple PDF download.");
      return;
    }
    if (tool.name.includes("Sign") || tool.name === "Request Signing") {
      downloadTextFile("PDFy-signing-request.txt", `PDFy signing workflow\nTool: ${tool.name}\nFile: ${file?.name || "No file selected"}\nRecipient: ${recipient || "Not provided"}\nInstructions: ${note}`);
      setStatus("A signing workflow file was generated. Connect this flow to e-signature services for production use.");
      return;
    }
    downloadTextFile("PDFy-processing-summary.txt", `PDFy processing summary\nTool: ${tool.name}\nFile: ${file?.name || "No file selected"}\nStatus: Ready for backend conversion engine\nNotes: ${note}`);
    setStatus("Workflow completed as a front-end handoff. Production conversion requires a secure backend processor.");
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[340px_1fr] lg:px-8">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-auto">
        <h2 className="mb-4 px-2 text-xl font-black text-slate-950">PDFy Tools</h2>
        {toolGroups.map((group) => <div key={group.title} className="mb-5"><h3 className="mb-2 px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{group.title}</h3>{group.tools.map((item) => { const Icon = item.icon; return <button key={item.name} onClick={() => { setSelectedTool(item.name); setFile(null); setStatus("Ready"); }} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${tool.name === item.name ? "bg-rose-500 text-white shadow-lg shadow-rose-100" : "hover:bg-slate-50"}`}><Icon size={18} /><span className="text-sm font-bold">{item.name}</span></button>; })}</div>)}
      </aside>
      <section>
        <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-950 to-slate-800 p-8 text-white shadow-2xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-rose-300">Selected tool</p><h1 className="mt-3 text-5xl font-black tracking-tight">{tool.name}</h1><p className="mt-4 max-w-2xl text-slate-300">{tool.description}</p></div><div className="rounded-3xl bg-white/10 p-4 text-sm"><p className="font-black">How to use</p><ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-300"><li>Upload or create content.</li><li>Review the options.</li><li>Process and download.</li></ol></div></div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div onClick={() => inputRef.current?.click()} className="grid cursor-pointer place-items-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center transition hover:border-rose-300 hover:bg-rose-50/40">
              <UploadCloud className="mb-4 text-rose-500" size={46} />
              <h3 className="text-2xl font-black text-slate-950">Drop your file here</h3>
              <p className="mt-2 text-sm text-slate-500">Accepted formats: {tool.accepts}</p>
              <p className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">{file ? file.name : "Choose file"}</p>
              <input ref={inputRef} hidden type="file" accept={tool.accepts} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
              <label className="block">
                <span className="mb-3 block text-sm font-black text-slate-700">Notes, text, instructions or PDF content</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-44 w-full rounded-3xl border border-slate-200 bg-white p-5 text-base leading-7 text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Add notes, text, instructions or document content here..."
                />
              </label>

              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-3 block text-sm font-black text-slate-700">Recipient email for signing</span>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-base outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </label>

                <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm leading-6 text-slate-600">
                  <Info className="mb-3 text-rose-500" />
                  <p>
                    Conversion tools for Word, LibreOffice, PPT, HTML, CSV, locked PDFs and OCR-based editable PDFs require a secure backend processor in production.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button onClick={processTool} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-7 py-4 font-black text-white shadow-xl shadow-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-600"><Download size={18} /> Process with {tool.name}</button>
              <p className="text-sm text-slate-500">Upload → Review → Process → Download</p>
            </div>
          </div>
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Tool status</h3>
            <div className="mt-4 rounded-3xl bg-slate-50 p-5"><p className="flex items-center gap-2 font-bold text-slate-800"><CheckCircle2 className="text-emerald-500" /> {status}</p><p className="mt-3 text-sm leading-6 text-slate-600">Designed for fast use on phone screens, tablets, kiosks, touchscreen displays, laptops and desktop PCs.</p></div>
            <div className="mt-6"><h4 className="mb-3 font-black text-slate-950">Best used for</h4><div className="grid gap-2 text-sm text-slate-600"><p>• Applications and forms</p><p>• Contracts and signing</p><p>• Reports and statements</p><p>• School and business submissions</p><p>• Customer service document support</p></div></div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SimplePage({ page, setActivePage, setSelectedTool }) {
  const [showSouthAfrica, setShowSouthAfrica] = useState(false);

  const copy = {
    About: [
      "PDFy is a premium all-in-one document management and PDF productivity platform designed to simplify how people create, convert, edit, organise, compress, review and sign documents across modern digital environments. PDFy solves everyday document challenges by providing a secure, intuitive and accessible workspace for students, professionals, businesses, consultants, public users, customer service environments and enterprise teams.",
      "PDFy helps users save time, improve document accuracy, reduce compatibility issues, simplify sharing, and maintain professional document standards across work, education, government, legal, financial and personal use cases. The platform is designed to support modern digital workflows including applications, contracts, onboarding, reporting, compliance documentation, customer support processing, academic submissions, archival preparation and secure document exchange."
    ],
    "Privacy Policy": [
      "PDFy respects and protects the privacy of every user who visits and uses the platform. This Privacy Policy explains how information is collected, used, stored, processed and protected when users access PDFy services, including PDF creation, document conversion, editing, compression, formatting, signing, sharing and related workflow tools. By using PDFy, users consent to the practices described in this Privacy Policy.",
      "PDFy may collect limited technical and usage information necessary for the operation, security and improvement of the platform. This may include IP address, browser type, device information, operating system, internet service provider, referring pages, timestamps, session duration, clickstream activity, file processing activity, upload/download events, diagnostic information and general geographic region. This information is used solely for system administration, performance optimisation, analytics, fraud prevention, troubleshooting, abuse monitoring and improving user experience.",
      "PDFy uses cookies, local storage technologies and similar technologies to improve functionality, remember user preferences, maintain session security, personalise interface settings and analyse platform performance. Users may disable cookies within their browser settings; however, certain platform features and functionality may become limited or unavailable.",
      "Documents uploaded to PDFy for conversion, editing, signing, compression or processing are handled securely and are used solely for the purpose of completing the requested document workflow. PDFy does not claim ownership of user documents or uploaded content. Uploaded files are not reviewed, shared, sold, rented, distributed or used for advertising or marketing purposes. PDFy does not sell personal information, uploaded documents or user activity data to third parties under any circumstances.",
      "PDFy may temporarily store uploaded files and processed outputs on secure systems solely for operational purposes including conversion processing, caching, download generation, troubleshooting, recovery, abuse prevention and system reliability. Files may be automatically deleted after a defined retention period or immediately after processing depending on platform configuration and infrastructure policies.",
      "Where applicable, PDFy may use third-party infrastructure providers, cloud hosting providers, analytics services, security providers, payment processors or document processing engines to support operation of the platform. Such providers are contractually required to maintain confidentiality, implement reasonable security safeguards and process information only for authorised operational purposes. PDFy does not permit third-party providers to use uploaded files or personal information for independent advertising or marketing activities.",
      "PDFy may use analytics technologies such as Google Analytics or equivalent analytics providers to better understand how users interact with the platform. Analytics may collect anonymous or aggregated information including page visits, session duration, feature usage, device type, browser information and performance metrics. This information is used exclusively to improve system usability, platform reliability and user experience.",
      "PDFy implements commercially reasonable administrative, technical and organisational safeguards designed to protect user information and uploaded documents against unauthorised access, misuse, disclosure, alteration or destruction. Security measures may include encrypted data transmission, secure server infrastructure, access controls, monitoring systems, automated threat detection and infrastructure hardening. However, no internet-based service or electronic storage method can be guaranteed to be completely secure.",
      "PDFy does not knowingly collect personally identifiable information from children under the age of 13. If a parent or guardian believes that a child has provided personal information through the platform, they are encouraged to contact PDFy immediately so appropriate removal steps may be taken.",
      "Users remain fully responsible for ensuring that they have the legal rights, permissions and authority to upload, process, edit, convert, sign or distribute any documents submitted through PDFy. Users should avoid uploading unlawful, malicious, infringing, confidential or unauthorised content that violates applicable laws, regulations or third-party rights.",
      "PDFy may disclose information where required by law, legal process, court order, governmental request or regulatory obligation, or where disclosure is reasonably necessary to protect platform security, enforce legal rights, prevent fraud, investigate abuse, respond to security incidents or protect users and the public.",
      "This Privacy Policy may be updated, revised or modified periodically to reflect legal, technical, operational or regulatory changes. Updated versions become effective immediately upon publication on the platform. Users are encouraged to review this Privacy Policy regularly to remain informed regarding how information is protected and handled.",
      "By accessing or using PDFy, users acknowledge that they have read, understood and agreed to this Privacy Policy and the related Terms and Conditions governing use of the platform."
    ],
    "Terms and Conditions": [
      "Please read these Terms and Conditions carefully before accessing or using PDFy. By accessing, browsing, uploading documents to, or using PDFy and any associated services, tools, workflows, APIs, applications or features, users acknowledge that they have read, understood and agreed to be legally bound by these Terms and Conditions. If a user does not agree to these Terms and Conditions, they must immediately discontinue use of the platform.",
      "PDFy provides document-related services including but not limited to PDF creation, document conversion, editing, formatting, compression, annotation, signing, document sharing, workflow automation and related informational tools. Services are provided for educational, informational, professional, business and productivity purposes only. PDFy does not provide legal, financial, compliance or professional advisory services, and users remain solely responsible for verifying the suitability, legality, completeness, security and accuracy of any processed documents or outputs.",
      "Users agree to use PDFy only for lawful purposes and in compliance with all applicable laws, regulations, intellectual property rights, data protection requirements and third-party rights. Users may not upload, process, transmit, distribute or store unlawful, fraudulent, malicious, defamatory, infringing, harmful, confidential, deceptive or unauthorised content through the platform.",
      "Users may not abuse, exploit, interfere with, reverse engineer, bypass security controls, scrape, overload, disrupt or attempt unauthorised access to PDFy systems, infrastructure, APIs, servers, databases, networks or associated technologies. Automated abuse, malicious uploads, malware distribution, denial-of-service activity, credential abuse, unlawful document processing and unauthorised commercial exploitation are strictly prohibited.",
      "All content, branding, software, source code, interfaces, workflows, graphics, designs, logos, databases, functionality, trademarks, trade dress and intellectual property associated with PDFy are owned by or licensed to WordShuffl Trading and are protected under applicable intellectual property, copyright and trademark laws in South Africa and internationally. Users may not reproduce, republish, distribute, modify, copy, scrape, sell, license or commercially exploit any part of the platform without prior written consent from WordShuffl Trading.",
      "Users remain solely and fully responsible for all documents, files, information, metadata, signatures, content, communications and activities processed, uploaded, converted, stored or transmitted through PDFy. Users acknowledge that PDFy does not verify document accuracy, legality, ownership, authenticity, enforceability or regulatory compliance.",
      "By using PDFy, users expressly agree to fully indemnify, defend and hold harmless PDFy, WordShuffl Trading, its owners, directors, employees, affiliates, contractors, licensors, technology providers, infrastructure providers, cloud providers, payment processors, partners, stakeholders, successors and assigns from and against any and all claims, disputes, losses, liabilities, damages, penalties, fines, proceedings, legal actions, regulatory investigations, demands, judgments, costs and expenses of every nature whatsoever, including legal fees and attorney costs, arising directly or indirectly from the use of the platform, uploaded content, processed documents, misuse of services, violation of laws, infringement of rights, unauthorised activities, security incidents, fraudulent conduct, document distribution, reliance on outputs, third-party disputes or breach of these Terms and Conditions.",
      "Users acknowledge and agree that all use of PDFy and related services is entirely at the user's own risk. PDFy and WordShuffl Trading make no warranties, guarantees or representations regarding uninterrupted availability, processing accuracy, conversion quality, compatibility, reliability, uptime, security, legality, performance, data retention, error-free operation or suitability for any particular purpose.",
      "Under no circumstances shall PDFy, WordShuffl Trading, its owners, employees, partners, stakeholders, service providers or affiliates be liable for any direct, indirect, incidental, consequential, punitive, special or exemplary damages, including but not limited to loss of data, loss of profits, business interruption, reputational damage, document corruption, operational downtime, security breaches, contractual disputes or financial losses arising from the use of or inability to use the platform, regardless of legal theory, negligence, contract, strict liability or otherwise.",
      "PDFy may integrate with or utilise third-party infrastructure, cloud hosting providers, analytics providers, payment processors, document engines, artificial intelligence services, security services or external technologies. PDFy does not accept responsibility or liability for the availability, security, accuracy or conduct of third-party services or websites accessed through or connected to the platform.",
      "PDFy reserves the right to suspend, restrict, terminate, investigate or remove access to any user, account, document, activity or service at its sole discretion where misuse, unlawful conduct, abuse, security threats, policy violations or operational risks are suspected.",
      "PDFy may update, revise, discontinue or modify any aspect of the platform, services, features, pricing structures, retention policies, security controls, APIs or these Terms and Conditions at any time without prior notice. Continued use of the platform following modifications constitutes acceptance of the revised Terms and Conditions.",
      "Users acknowledge that electronic communications, uploads, downloads and internet-based processing may involve inherent technical risks. While commercially reasonable safeguards may be implemented, PDFy cannot guarantee absolute security, uninterrupted operation or protection against all cyber threats, data loss events or infrastructure failures.",
      "These Terms and Conditions shall be governed by and interpreted in accordance with the laws of the Republic of South Africa. Any dispute, legal proceeding or claim arising from or relating to PDFy, its services or these Terms and Conditions shall be subject to the exclusive jurisdiction of the competent courts of South Africa.",
      "By continuing to access or use PDFy, users acknowledge and agree that they fully understand, accept and consent to these Terms and Conditions, including all indemnification obligations, limitations of liability, jurisdiction provisions and operational conditions described herein."
    ],
    Contact: [
      "For support, partnerships, product enquiries, privacy requests, legal notices or general platform assistance, contact the PDFy team through the details below."
    ]
  };

  if (page === "Sitemap") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">PDFy</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950">Interactive Sitemap</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Navigate every major PDFy page, workflow and document tool visually. This sitemap helps users quickly jump to the exact service they need.</p>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="mb-5 text-2xl font-black text-slate-950">Main Pages</h2>
              <div className="grid gap-3">
                {["Home", "About", "Privacy Policy", "Terms and Conditions", "Contact"].map((item) => (
                  <button key={item} onClick={() => { setActivePage(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center justify-between rounded-2xl bg-white p-4 text-left font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:bg-rose-50 hover:text-rose-600">
                    {item}
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
            </div>

            {toolGroups.map((group) => (
              <div key={group.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-2xl font-black text-slate-950">{group.title}</h2>
                <div className="grid gap-3">
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button key={tool.name} onClick={() => { setActivePage("Tools"); setSelectedTool(tool.name); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:border-rose-200 hover:bg-rose-50">
                        <span className="rounded-2xl bg-rose-100 p-3 text-rose-600"><Icon size={20} /></span>
                        <div>
                          <h3 className="font-black text-slate-900">{tool.name}</h3>
                          <p className="text-sm text-slate-500">{tool.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const paragraphs = Array.isArray(copy[page]) ? copy[page] : [copy[page]];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">PDFy</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950">{page}</h1>
        <div className="mt-6 space-y-6 text-lg leading-8 text-slate-600">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>

        {page === "Contact" && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-6">
              <Mail className="mb-3 text-rose-500" />
              <h3 className="font-black">Email</h3>
              <a href="mailto:support@pdfy.com" className="text-slate-600 transition hover:text-rose-500 hover:underline">support@pdfy.com</a>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6">
              <Map className="mb-3 text-rose-500" />
              <h3 className="font-black">Location</h3>
              <button onClick={() => setShowSouthAfrica(true)} className="text-left text-slate-600 transition hover:text-rose-500 hover:underline">South Africa</button>
            </div>
          </div>
        )}
      </div>

      {showSouthAfrica && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">Location spotlight</p>
                <h2 className="mt-2 text-4xl font-black text-slate-950">South Africa</h2>
                <p className="mt-2 text-slate-600">A country at the southern tip of Africa, bordered by the Atlantic and Indian Oceans.</p>
              </div>
              <button onClick={() => setShowSouthAfrica(false)} className="rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-rose-100 hover:text-rose-600"><X size={22} /></button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">World map location</h3>
                    <p className="text-sm text-slate-500">South Africa marked on a real interactive map.</p>
                  </div>
                  <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white">SA</span>
                </div>
                <div className="relative h-[430px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 shadow-inner">
                  <iframe title="World map showing South Africa" src="https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-60%2C180%2C85&layer=mapnik&marker=-30.5595%2C22.9375" className="h-full w-full border-0" loading="lazy" />
                  <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
                    <p className="text-sm font-black text-slate-950">📍 South Africa</p>
                    <p className="mt-1 text-xs text-slate-600">Southern tip of the African continent</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-2xl font-black text-slate-950">10 interesting facts</h3>
                <div className="grid gap-3">
                  {[
                    "South Africa has 11 official languages, making it one of the most linguistically diverse countries in the world.",
                    "It is often called the Rainbow Nation because of its rich cultural diversity.",
                    "South Africa has three capital cities: Pretoria, Cape Town and Bloemfontein.",
                    "Table Mountain in Cape Town is one of the country’s most recognisable natural landmarks.",
                    "The country is home to the Kruger National Park, one of Africa’s best-known wildlife reserves.",
                    "South Africa is known for major industries including mining, finance, tourism, agriculture and technology.",
                    "It has coastlines on both the Atlantic Ocean and the Indian Ocean.",
                    "South Africa hosted the 2010 FIFA World Cup, the first held on the African continent.",
                    "The country is famous for gold, diamonds, platinum and other mineral resources.",
                    "South Africa has a strong constitution and a Constitutional Court that plays an important role in democracy."
                  ].map((fact, index) => (
                    <div key={fact} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500 text-sm font-black text-white">{index + 1}</span>
                      <p className="text-sm leading-6 text-slate-600">{fact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

function Footer({ setActivePage }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_2fr] lg:px-8">
        <div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500 text-white"><FileText size={20} /></span><span className="text-2xl font-black">PDFy</span></div><p className="mt-4 max-w-md text-sm leading-6 text-slate-600">A premium PDF conversion, editing and signing workspace for everyone.</p></div>
        <div className="grid gap-6 sm:grid-cols-3"><div><h4 className="font-black">Pages</h4><div className="mt-3 grid gap-2">{pages.map((p) => <button key={p} onClick={() => setActivePage(p)} className="text-left text-sm text-slate-600 hover:text-rose-500">{p}</button>)}</div></div><div><h4 className="font-black">Popular tools</h4><div className="mt-3 grid gap-2">{["Create PDF", "PDF to Word", "Sign PDF", "Compress PDF"].map((p) => <button key={p} onClick={() => setActivePage("Tools")} className="text-left text-sm text-slate-600 hover:text-rose-500">{p}</button>)}</div></div><div><h4 className="font-black">Legal notice</h4><p className="mt-3 text-sm leading-6 text-slate-600">PDFy® is a registered trademark. All intellectual property rights in and to the game are owned in South Africa by WordShuffl Trading.<br />This site is for educational and informational purposes only.<br />© 2026 PDFy.com. ALL RIGHTS RESERVED</p></div></div>
      </div>
    </footer>
  );
}

export default function PDFyWebsite() {
  const [activePage, setActivePage] = useState("Home");
  const [selectedTool, setSelectedTool] = useState("Create PDF");
  const page = useMemo(() => {
    if (activePage === "Home") return <Home setActivePage={setActivePage} />;
    if (activePage === "Tools") return <ToolsPage selectedTool={selectedTool} setSelectedTool={setSelectedTool} />;
    return <SimplePage page={activePage} setActivePage={setActivePage} setSelectedTool={setSelectedTool} />;
  }, [activePage, selectedTool]);
  return <div className="min-h-screen bg-slate-50 font-sans text-slate-900"><Header activePage={activePage} setActivePage={setActivePage} selectedTool={selectedTool} setSelectedTool={setSelectedTool} />{page}<Footer setActivePage={setActivePage} /></div>;
}
