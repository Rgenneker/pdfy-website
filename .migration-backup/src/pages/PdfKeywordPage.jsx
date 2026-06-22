import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import keywords from "../data/pdf-keywords.json";


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
        <Link to="/" className="text-blue-600 underline">Back to PDFShuffl</Link>
      </main>
    );
  }
useEffect(() => {
  document.title = `${page.keyword} | PDFShuffl`;

  const description = `Use PDFShuffl for ${page.keyword}. Convert, edit, compress, merge and manage PDF files online.`;

  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }

  meta.content = description;
}, [page.keyword]);
  return (
<>
       <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-4">
        {page.keyword}
      </h1>

      <p className="text-lg mb-6">
        Use PDFShuffl for {page.keyword}. Convert, edit, compress, merge, split and manage PDF files online.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          About {page.keyword}
        </h2>
        <p>
          This page helps users looking for {page.keyword}. PDFShuffl provides simple browser-based PDF tools for common document tasks.
        </p>
      </section>
      <section className="mb-8">
  <h2 className="text-2xl font-semibold mb-3">
    Related PDF Searches
  </h2>

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