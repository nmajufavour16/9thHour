import Link from "next/link";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders legally-reviewed markdown verbatim. Headings use Playfair, body DM Sans,
// purple accents on links/subheadings — matching the dark theme tokens.
const components: Components = {
  h1: ({ children }) => (
    <h1
      className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-6"
      style={{ color: "var(--color-text-primary)" }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="font-display text-2xl font-semibold mt-12 mb-4 scroll-mt-20"
      style={{ color: "var(--color-primary-light)" }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="font-display text-xl font-semibold mt-8 mb-3"
      style={{ color: "var(--color-text-primary)" }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      className="text-[15px] leading-7 mb-4"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="underline underline-offset-2"
      style={{ color: "var(--color-primary-light)" }}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic" style={{ color: "var(--color-text-secondary)" }}>
      {children}
    </em>
  ),
  ul: ({ children }) => (
    <ul
      className="list-disc pl-6 mb-4 space-y-2 text-[15px] leading-7"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className="list-decimal pl-6 mb-4 space-y-2 text-[15px] leading-7"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  hr: () => <hr className="my-8" style={{ borderColor: "var(--color-border)" }} />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table
        className="w-full border-collapse text-sm"
        style={{ borderColor: "var(--color-border)" }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="text-left p-3 border font-semibold align-top"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-bg-elevated)",
        color: "var(--color-text-primary)",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="p-3 border align-top text-[14px] leading-6"
      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
    >
      {children}
    </td>
  ),
};

export default function LegalDocument({ content }: { content: string }) {
  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-80"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span aria-hidden>←</span> Back
        </Link>

        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
