import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ARTICLE_AUTHOR,
  getCategory,
  getRelatedArticles,
  readTimeMinutes,
} from "../data/articles/index.js";
import LearningPrompt from "../Components/LearningPrompt";

const SITE_URL = "https://pdfshuffl.com";

function toolPath(toolName) {
  return `/tools/${toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function ArticleView({ article }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [article.slug]);

  const category = getCategory(article.categoryId);
  const related = getRelatedArticles(article, 4);
  const minutes = readTimeMinutes(article);
  const canonical = `${SITE_URL}/articles/${article.slug}`;

  const faqItems = [];
  for (const section of article.sections || []) {
    for (const item of section.faq || []) faqItems.push(item);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        author: { "@type": "Organization", name: ARTICLE_AUTHOR },
        publisher: {
          "@type": "Organization",
          name: "PDFShuffl",
          url: SITE_URL,
        },
        datePublished: article.datePublished,
        dateModified: article.datePublished,
        mainEntityOfPage: canonical,
        articleSection: category?.title,
        keywords: [article.keyword, ...(article.secondaryKeywords || [])].join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "PDFShuffl", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` },
          { "@type": "ListItem", position: 3, name: article.title, item: canonical },
        ],
      },
      ...(faqItems.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <Helmet>
        <title>{`${article.title} | PDFShuffl`}</title>
        <meta name="description" content={article.excerpt} />
        <meta
          name="keywords"
          content={[article.keyword, ...(article.secondaryKeywords || [])].join(", ")}
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          <Link to="/" className="hover:text-rose-500">Home</Link>
          <span>/</span>
          <Link to="/articles" className="hover:text-rose-500">Articles</Link>
          {category && (
            <>
              <span>/</span>
              <Link to={`/articles#${category.slug}`} className="hover:text-rose-500">
                {category.title}
              </Link>
            </>
          )}
        </nav>

        <article>
          <header className="border-b border-slate-200 pb-8">
            {category && (
              <Link
                to={`/articles#${category.slug}`}
                className="text-xs font-black uppercase tracking-[0.18em] text-rose-500 hover:text-rose-600"
              >
                {category.title}
              </Link>
            )}
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{article.excerpt}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-slate-500">
              <span className="text-slate-700">By {ARTICLE_AUTHOR}</span>
              <span aria-hidden>•</span>
              <span>{minutes} min read</span>
              <span aria-hidden>•</span>
              <span>{formatDate(article.datePublished)}</span>
            </div>
          </header>

          <div className="mt-8 space-y-10">
            {article.sections.map((section, index) => (
              <section key={index}>
                {section.h && (
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {section.h}
                  </h2>
                )}
                {(section.p || []).map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className="mt-4 text-lg leading-8 text-slate-700"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.ul && section.ul.length > 0 && (
                  <ul className="mt-4 space-y-2 pl-1">
                    {section.ul.map((item, liIndex) => (
                      <li
                        key={liIndex}
                        className="flex gap-3 text-lg leading-8 text-slate-700"
                      >
                        <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-rose-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.faq && section.faq.length > 0 && (
                  <div className="mt-5 space-y-5">
                    {section.faq.map((item, fIndex) => (
                      <div
                        key={fIndex}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <h3 className="font-black text-slate-900">{item.q}</h3>
                        <p className="mt-2 leading-7 text-slate-600">{item.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </article>

        <LearningPrompt topic={article.slug} />

        {article.relatedTools && article.relatedTools.length > 0 && (
          <section className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Tools mentioned in this article
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {article.relatedTools.map((toolName) => (
                <Link
                  key={toolName}
                  to={toolPath(toolName)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100"
                >
                  {toolName}
                </Link>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Continue reading
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((item) => {
                const itemCategory = getCategory(item.categoryId);
                return (
                  <Link
                    key={item.slug}
                    to={`/articles/${item.slug}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-rose-200 hover:bg-rose-50 hover:shadow-lg"
                  >
                    {itemCategory && (
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">
                        {itemCategory.title}
                      </p>
                    )}
                    <h3 className="mt-2 font-black leading-snug text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-xs font-bold text-slate-500">
                      {readTimeMinutes(item)} min read
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/articles"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
          >
            All articles
          </Link>
          <Link
            to="/tools"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-rose-200 hover:text-rose-600"
          >
            Open PDF tools
          </Link>
        </div>
      </main>
    </>
  );
}
