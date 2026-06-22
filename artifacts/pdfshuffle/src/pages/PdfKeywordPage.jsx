import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import keywords from "../data/pdf-keywords.json";

const SITE_URL = "https://pdfshuffl.com";

export default function PdfKeywordPage() {
  const { slug } = useParams();

  const page = keywords.find((item) => item.slug === slug);
  const words = page?.keyword?.split(" ") || [];

  const relatedKeywords = keywords
    .filter(
      (k) =>
        k.slug !== slug &&
        words.some((word) =>
          k.keyword.toLowerCase().includes(word.toLowerCase())
        )
    )
    .slice(0, 10);

  if (!page) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">PDF Tool Page Not Found</h1>
        <Link to="/" className="text-blue-600 underline">
          Back to PDFShuffl
        </Link>
      </main>
    );
  }

  const title = `${page.keyword} | PDFShuffl`;
  const description = `Use PDFShuffl for ${page.keyword}. Convert, edit, compress, merge and manage PDF files online.`;
  const canonical = `${SITE_URL}/pdf/${page.slug}`;

  const faq = [
    {
      q: `Is ${page.keyword} free on PDFShuffl?`,
      a: `Yes. PDFShuffl provides ${page.keyword} directly in your browser at no cost.`,
    },
    {
      q: `Do I need to install anything for ${page.keyword}?`,
      a: `No installation is required. PDFShuffl runs online, so you can handle ${page.keyword} from any device.`,
    },
    {
      q: `Are my files safe when I use ${page.keyword}?`,
      a: `Your documents are processed securely and are not shared, keeping ${page.keyword} private and safe.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${page.keyword} — PDFShuffl`,
        url: canonical,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: {
          "@type": "Organization",
          name: "PDFShuffl",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "PDFShuffl",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.keyword,
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">{page.keyword}</h1>

        <p className="text-lg mb-6">
          Use PDFShuffl for {page.keyword}. Convert, edit, compress, merge, split
          and manage PDF files online.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">About {page.keyword}</h2>
          <p>
            This page helps users looking for {page.keyword}. PDFShuffl provides
            simple browser-based PDF tools for common document tasks.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Related PDF Searches</h2>
          <ul className="list-disc pl-6">
            {relatedKeywords.map((item) => (
              <li key={item.slug}>
                <Link
                  to={`/pdf/${item.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.keyword}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">PDFShuffl Tools</h2>
          <ul className="list-disc pl-6">
            <li>Convert PDF files</li>
            <li>Compress PDF documents</li>
            <li>Merge and split PDF files</li>
            <li>Edit and organise PDF pages</li>
          </ul>
        </section>
      </main>
    </>
  );
}
