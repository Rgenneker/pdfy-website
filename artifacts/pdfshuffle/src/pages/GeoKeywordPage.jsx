import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  SITE_URL,
  parseGeoSlug,
  relatedGeoLinks,
  titleCase,
} from "../data/geo-config";

export default function GeoKeywordPage() {
  const { slug } = useParams();
  const page = parseGeoSlug(slug);

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

  const { tool, location, modifier } = page;
  const heading = `${tool} in ${location} ${titleCase(modifier)}`.trim();
  const title = `${tool} in ${location} | PDFShuffl`;
  const description = `${tool} in ${location} ${modifier}. PDFShuffl is a fast, secure, browser-based PDF tool for users in ${location}, convert, edit, compress, merge and sign PDF files online.`;
  const canonical = `${SITE_URL}/geo/${slug}`;
  const related = relatedGeoLinks(tool, location, modifier, 10);

  const faq = [
    {
      q: `Is ${tool} available for users in ${location}?`,
      a: `Yes. PDFShuffl works in ${location} and worldwide directly in your browser, with no installation required.`,
    },
    {
      q: `Is ${tool} in ${location} free to use?`,
      a: `PDFShuffl offers ${tool.toLowerCase()} online ${modifier} for users in ${location}.`,
    },
    {
      q: `Are my files secure when I use ${tool} in ${location}?`,
      a: `Your documents are processed securely and are not shared, making PDFShuffl a safe choice for users in ${location}.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${tool} in ${location}, PDFShuffl`,
        url: canonical,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        areaServed: location,
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
            name: tool,
            item: `${SITE_URL}/tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${tool} in ${location}`,
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
        <h1 className="text-4xl font-bold mb-4">{heading}</h1>

        <p className="text-lg mb-6">
          Looking for {tool.toLowerCase()} in {location}? PDFShuffl gives users
          across {location} a fast, secure way to convert, edit, compress, merge,
          split and sign PDF files online, {modifier}, with nothing to install.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            {tool} for users in {location}
          </h2>
          <p>
            This page helps people searching for {tool.toLowerCase()} in{" "}
            {location}. PDFShuffl runs entirely in your browser, so you can work
            with documents from any device in {location} without uploading them to
            heavy desktop software.
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
          <h2 className="text-2xl font-semibold mb-3">Related PDF tools</h2>
          <ul className="list-disc pl-6">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  to={`/geo/${item.slug}`}
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
          <p className="mt-4">
            <Link to="/" className="text-blue-600 underline">
              Open PDFShuffl
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
