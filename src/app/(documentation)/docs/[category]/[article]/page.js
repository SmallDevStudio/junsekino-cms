import { notFound } from "next/navigation";

import DocsArticle from "@/components/docs/DocsArticle";

import { DOCS_CATEGORIES } from "@/constants/docs-navigation";

function findArticle(categoryId, articleId) {
  const category = DOCS_CATEGORIES.find((item) => item.id === categoryId);

  const article = category?.items.find((item) => item.id === articleId);

  if (!category || !article) {
    return null;
  }

  return {
    category,
    article,
  };
}

export function generateStaticParams() {
  return DOCS_CATEGORIES.flatMap((category) =>
    category.items
      .filter((article) => article.href !== "/docs")
      .map((article) => ({
        category: category.id,
        article: article.id,
      })),
  );
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const resolved = findArticle(resolvedParams.category, resolvedParams.article);

  if (!resolved) {
    return {
      title: "Documentation Not Found",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: resolved.article.title?.en || "Documentation",

    description:
      resolved.article.description?.en || "Junsekino CMS documentation.",

    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DocsArticlePage({ params }) {
  const resolvedParams = await params;

  const categoryId = String(resolvedParams.category || "")
    .trim()
    .toLowerCase();

  const articleId = String(resolvedParams.article || "")
    .trim()
    .toLowerCase();

  if (!findArticle(categoryId, articleId)) {
    notFound();
  }

  return <DocsArticle categoryId={categoryId} articleId={articleId} />;
}
