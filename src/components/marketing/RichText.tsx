import React from "react";
import Link from "next/link";
import type { LexicalNode } from "@/lib/cms-pages";

// Lexical text format bit flags.
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_UNDERLINE = 8;

function safeHref(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return null;
}

function renderText(node: LexicalNode, key: number): React.ReactNode {
  let content: React.ReactNode = node.text ?? "";
  const format = typeof node.format === "number" ? node.format : 0;
  if (format & IS_BOLD) content = <strong>{content}</strong>;
  if (format & IS_ITALIC) content = <em>{content}</em>;
  if (format & IS_UNDERLINE) content = <u>{content}</u>;
  return <React.Fragment key={key}>{content}</React.Fragment>;
}

function renderChildren(nodes: LexicalNode[] | undefined): React.ReactNode[] {
  return (nodes ?? []).map((node, index) => renderNode(node, index));
}

function renderNode(node: LexicalNode, key: number): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "linebreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{renderChildren(node.children)}</p>;
    case "heading": {
      const tag = node.tag === "h1" || node.tag === "h2" ? "h2" : node.tag === "h3" ? "h3" : "h4";
      return React.createElement(tag, { key }, renderChildren(node.children));
    }
    case "list":
      return node.listType === "number" ? (
        <ol key={key}>{renderChildren(node.children)}</ol>
      ) : (
        <ul key={key}>{renderChildren(node.children)}</ul>
      );
    case "listitem":
      return <li key={key}>{renderChildren(node.children)}</li>;
    case "quote":
      return <blockquote key={key}>{renderChildren(node.children)}</blockquote>;
    case "link":
    case "autolink": {
      const href = safeHref(node.fields?.url ?? node.url);
      if (!href) return <React.Fragment key={key}>{renderChildren(node.children)}</React.Fragment>;
      return href.startsWith("/") ? (
        <Link key={key} href={href}>{renderChildren(node.children)}</Link>
      ) : (
        <a key={key} href={href} target={node.fields?.newTab ? "_blank" : undefined} rel="noopener noreferrer">
          {renderChildren(node.children)}
        </a>
      );
    }
    default:
      return node.children ? <React.Fragment key={key}>{renderChildren(node.children)}</React.Fragment> : null;
  }
}

/** Renders Lexical rich text from the Payload admin with plain, accessible markup. */
export function RichText({ root }: { root: LexicalNode | undefined }) {
  return <div className="prose-legal">{renderChildren(root?.children)}</div>;
}
