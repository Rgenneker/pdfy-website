import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ARTICLE_AUTHOR,
  articleCategories,
  articles,
  getArticlesByCategory,
  readTimeMinutes,
} from "../data/articles/index.js";

const SITE_URL = "https://pdfshuffl.com";

function toolPath(toolName) {
  return `/tools/${toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

export default function ArticlesPage() {
  const canonical = `${SITE_URL}/articles`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PDFShuffl Articles",
    url: canonical,
    description:
      "Expert PDF guides and knowledge articles covering document conversion, editing, signing, security and workflows.",
    publisher: { "@type": "Organization", name: "PDFShuffl", url: SITE_URL },
  };

  return (
    <>
      <Helmet>
        <title>PDF Guides &amp; Knowledge Articles | PDFShuffl</title>
        <meta
          name="description"
          content="In-depth PDF articles by the Lexigenz Authors: converting Office files to PDF, turning PDFs back into editable formats, and image, web, signing and security workflows."
        />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <header className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
            PDFShuffl Knowledge Library
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950">
            PDF Guides, Workflows &amp; Knowledge Articles
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Practical, in-depth articles written by the {ARTICLE_AUTHOR} editorial
            desk. Every guide is grounded in real document work, how to do the task,
            where it matters, why it beats the alternatives, and the benefits you can
            expect. Articles are organised by the three PDFShuffl tool categories.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {articleCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.slug}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                {category.title}
              </a>
            ))}
            <Link
              to="/tools"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500"
            >
              Open PDF tools
            </Link>
          </div>
          <p className="mt-5 text-sm font-bold text-slate-400">
            {articles.length} articles and growing.
          </p>
        </header>

        {articleCategories.map((category) => {
          const categoryArticles = getArticlesByCategory(category.id);
          if (categoryArticles.length === 0) return null;
          return (
            <section
              key={category.id}
              id={category.slug}
              className="mt-14 scroll-mt-24"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
                <div className="max-w-2xl">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
                    {category.tagline}
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {category.title}
                  </h2>
                  <p className="mt-3 text-slate-600">{category.description}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Tools:
                </span>
                {category.tools.map((toolName) => (
                  <Link
                    key={toolName}
                    to={toolPath(toolName)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    {toolName}
                  </Link>
                ))}
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {categoryArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/articles/${article.slug}`}
                    className="flex flex-col rounded-3xl border border-slate-200 bg-slate-50 p-6 text-left transition hover:-translate-y-1 hover:border-rose-200 hover:bg-rose-50 hover:shadow-lg"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">
                      {category.title}
                    </p>
                    <h3 className="mt-3 text-xl font-black leading-snug text-slate-950">
                      {article.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {article.excerpt}
                    </p>
                    <p className="mt-5 text-xs font-bold text-slate-500">
                      {ARTICLE_AUTHOR} • {readTimeMinutes(article)} min read
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-16 rounded-[2.5rem] bg-slate-950 p-8 text-white">
          <h2 className="text-3xl font-black">Put the knowledge to work</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Every article pairs with a tool you can use right now. Jump into the
            workspace, or explore the full sitemap of pages and tools.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/tools"
              className="rounded-full bg-rose-500 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600"
            >
              Open the tools
            </Link>
            <Link
              to="/sitemap"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Browse the sitemap
            </Link>
            <Link
              to="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
