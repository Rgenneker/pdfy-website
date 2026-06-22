export type ToolCategory = "convert" | "extract" | "edit" | "signing" | "coming-soon";

export interface ToolField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  multiline?: boolean;
}

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  inputType: "text" | "file" | "file+text";
  fileTypes?: string[];
  fileExtensions?: string[];
  outputExtension: string;
  outputMime: string;
  fields?: ToolField[];
  available: boolean;
}

export const TOOLS: Tool[] = [
  {
    slug: "create-pdf",
    name: "Create PDF",
    description: "Type or paste text and instantly generate a polished PDF document.",
    category: "convert",
    icon: "document-text",
    inputType: "text",
    outputExtension: "pdf",
    outputMime: "application/pdf",
    fields: [
      {
        key: "text",
        label: "Document Content",
        placeholder: "Type your document content here...",
        required: true,
        multiline: true,
      },
    ],
    available: true,
  },
  {
    slug: "txt-to-pdf",
    name: "TXT to PDF",
    description: "Convert a plain text file into a clean, shareable PDF.",
    category: "convert",
    icon: "code-slash",
    inputType: "file",
    fileTypes: ["text/plain"],
    fileExtensions: [".txt"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "jpg-to-pdf",
    name: "Image to PDF",
    description: "Turn a JPG or PNG photo into a single-page PDF instantly.",
    category: "convert",
    icon: "image",
    inputType: "file",
    fileTypes: ["image/jpeg", "image/png", "image/*"],
    fileExtensions: [".jpg", ".jpeg", ".png"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert a .docx Word document to a universally compatible PDF.",
    category: "convert",
    icon: "document",
    inputType: "file",
    fileTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    fileExtensions: [".docx"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "csv-to-pdf",
    name: "CSV to PDF",
    description: "Export a spreadsheet CSV as a clean, readable PDF table.",
    category: "convert",
    icon: "grid",
    inputType: "file",
    fileTypes: ["text/csv", "text/comma-separated-values"],
    fileExtensions: [".csv"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "ppt-to-pdf",
    name: "PPT to PDF",
    description: "Convert PowerPoint presentations into clean PDF documents.",
    category: "convert",
    icon: "easel",
    inputType: "file",
    fileTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ],
    fileExtensions: [".pptx", ".ppt"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Export Excel spreadsheets as formatted PDF reports.",
    category: "convert",
    icon: "stats-chart",
    inputType: "file",
    fileTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    fileExtensions: [".xlsx", ".xls"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "libre-to-pdf",
    name: "LibreOffice to PDF",
    description: "Convert LibreOffice Writer, Calc, and Impress files (ODT, ODS, ODP) into PDF.",
    category: "convert",
    icon: "layers",
    inputType: "file",
    fileTypes: [
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
    ],
    fileExtensions: [".odt", ".ods", ".odp"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert an HTML file to a rendered PDF. Requires Puppeteer.",
    category: "coming-soon",
    icon: "globe",
    inputType: "file",
    fileExtensions: [".html", ".htm"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: false,
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size for easier sharing and storage.",
    category: "edit",
    icon: "archive",
    inputType: "file",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "pdf-to-txt",
    name: "PDF to Text",
    description: "Extract all readable text from a PDF into a plain .txt file.",
    category: "extract",
    icon: "text",
    inputType: "file",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "txt",
    outputMime: "text/plain",
    available: true,
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert a PDF's content into an editable Word .docx document.",
    category: "extract",
    icon: "create",
    inputType: "file",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "docx",
    outputMime:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    available: true,
  },
  {
    slug: "pdf-to-html",
    name: "PDF to HTML",
    description: "Convert PDF content to an HTML file. Requires system tools.",
    category: "coming-soon",
    icon: "code",
    inputType: "file",
    fileExtensions: [".pdf"],
    outputExtension: "html",
    outputMime: "text/html",
    available: false,
  },
  {
    slug: "pdf-to-libre",
    name: "PDF to LibreOffice",
    description: "Convert a PDF into an editable LibreOffice Writer (.odt) document.",
    category: "extract",
    icon: "swap-horizontal",
    inputType: "file",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "odt",
    outputMime: "application/vnd.oasis.opendocument.text",
    available: true,
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    description: "Stamp your name as a digital signature on the last page of a PDF.",
    category: "edit",
    icon: "pencil",
    inputType: "file+text",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    fields: [
      {
        key: "signerName",
        label: "Signer Name",
        placeholder: "Your full name",
        required: false,
      },
    ],
    available: true,
  },
  {
    slug: "crop-pdf",
    name: "Crop PDF",
    description: "Remove margins from every page of a PDF by applying a 30px crop.",
    category: "edit",
    icon: "crop",
    inputType: "file",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    available: true,
  },
  {
    slug: "request-signing",
    name: "Request Signing",
    description: "Create a signing request document with signer details and instructions.",
    category: "signing",
    icon: "mail",
    inputType: "file+text",
    fileTypes: ["application/pdf"],
    fileExtensions: [".pdf"],
    outputExtension: "pdf",
    outputMime: "application/pdf",
    fields: [
      {
        key: "requesterName",
        label: "Requested By",
        placeholder: "Your name",
        required: false,
      },
      {
        key: "signerName",
        label: "Signer Name",
        placeholder: "Recipient's name",
        required: false,
      },
      {
        key: "instructions",
        label: "Instructions",
        placeholder: "Please sign the highlighted sections...",
        required: false,
        multiline: true,
      },
    ],
    available: true,
  },
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  convert: "Convert to PDF",
  extract: "Extract from PDF",
  edit: "Edit PDF",
  signing: "Signing",
  "coming-soon": "Coming Soon",
};

export const FEATURED_SLUGS = [
  "create-pdf",
  "jpg-to-pdf",
  "word-to-pdf",
  "pdf-to-txt",
  "sign-pdf",
  "crop-pdf",
  "csv-to-pdf",
  "pdf-to-word",
];

export const getToolBySlug = (slug: string): Tool | undefined =>
  TOOLS.find((t) => t.slug === slug);

export const getAvailableTools = (): Tool[] => TOOLS.filter((t) => t.available);

export const getToolsByCategory = (
  category: ToolCategory
): Tool[] => TOOLS.filter((t) => t.category === category);
