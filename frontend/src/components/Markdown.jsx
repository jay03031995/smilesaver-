import React from "react";

// Lightweight markdown renderer for blog posts (no external dependency).
// Supports: ## H2, ### H3, paragraphs, - lists, > blockquotes, **bold**,
// [text](url) links, basic | tables.
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function renderInline(text) {
  // links
  let parts = [];
  let key = 0;
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = linkRe.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [, label, href] = match;
    const isInternal = href.startsWith("/");
    parts.push(
      <a key={`l-${key++}`} href={href} target={isInternal ? "_self" : "_blank"} rel={isInternal ? undefined : "noopener noreferrer"}
         className="text-cocoa underline underline-offset-4 decoration-cream hover:decoration-cocoa transition-colors">
        {label}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  // bold within remaining string parts
  return parts.flatMap((p, i) => {
    if (typeof p !== "string") return [p];
    const seg = p.split(/(\*\*[^*]+\*\*)/g);
    return seg.map((s, j) => s.startsWith("**") && s.endsWith("**")
      ? <strong key={`b-${i}-${j}`} className="text-ink font-semibold">{s.slice(2, -2)}</strong>
      : <React.Fragment key={`t-${i}-${j}`}>{s}</React.Fragment>);
  });
}

function renderTable(block) {
  const lines = block.split("\n").filter(Boolean);
  if (lines.length < 2) return null;
  const head = lines[0].split("|").map(c => c.trim()).filter(Boolean);
  const rows = lines.slice(2).map(l => l.split("|").map(c => c.trim()).filter(Boolean));
  return (
    <div className="overflow-x-auto my-7">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className="text-left px-4 py-3 bg-beige border border-cream font-serif text-ink">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-beige/40">
              {r.map((c, j) => <td key={j} className="px-4 py-3 border border-cream text-inkmuted">{renderInline(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Markdown({ source = "" }) {
  const blocks = source.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
  return (
    <div className="prose-content">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) {
          const text = b.slice(3);
          return <h2 key={i} id={slugify(text)} className="font-serif text-3xl md:text-4xl text-ink mt-12 mb-5 leading-tight">{renderInline(text)}</h2>;
        }
        if (b.startsWith("### ")) {
          const text = b.slice(4);
          return <h3 key={i} id={slugify(text)} className="font-serif text-2xl text-ink mt-8 mb-3 leading-tight">{renderInline(text)}</h3>;
        }
        if (b.startsWith("> ")) {
          return <blockquote key={i} className="border-l-4 border-cocoa pl-5 italic text-inkmuted my-6">{renderInline(b.slice(2))}</blockquote>;
        }
        if (b.startsWith("- ") || b.startsWith("1. ")) {
          const ordered = b.startsWith("1. ");
          const items = b.split("\n").map(l => l.replace(/^(- |\d+\. )/, "")).filter(Boolean);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={`${ordered ? "list-decimal" : "list-disc"} pl-6 space-y-2 my-5 text-ink/85 leading-relaxed`}>
              {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
            </Tag>
          );
        }
        if (b.includes("|") && b.split("\n").length >= 2 && b.split("\n")[1].includes("---")) {
          return <React.Fragment key={i}>{renderTable(b)}</React.Fragment>;
        }
        return <p key={i} className="text-ink/85 leading-relaxed text-base md:text-lg mb-5">{renderInline(b)}</p>;
      })}
    </div>
  );
}

// Helper: extract H2 headings for table-of-contents
export function extractTOC(source = "") {
  const lines = source.split("\n");
  return lines.filter(l => l.startsWith("## ")).map(l => {
    const text = l.slice(3).trim();
    return { id: slugify(text), text };
  });
}
