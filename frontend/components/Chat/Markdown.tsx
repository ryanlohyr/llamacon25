import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownTable = ({ children, ...props }: any) => {
  return (
    <div className="relative py-4">
      <div className="relative my-4 overflow-x-auto rounded-lg">
        <table
          className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700"
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");

      return !inline && match ? (
        <pre
          {...props}
          className={`${className} mt-2 w-[80dvw] overflow-x-scroll rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800 md:max-w-[500px]`}
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} rounded-md bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800`}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children, ...props }: any) => {
      return (
        <h1 className="mb-3 text-2xl font-bold" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }: any) => {
      return (
        <h2 className="mb-2 text-xl font-bold" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: any) => {
      return (
        <h3 className="mb-2 text-lg font-bold" {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }: any) => {
      return (
        <h4 className="mb-1 text-base font-bold" {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ children, ...props }: any) => {
      return (
        <h5 className="mb-1 text-sm font-bold" {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ children, ...props }: any) => {
      return (
        <h6 className="mb-1 text-xs font-bold" {...props}>
          {children}
        </h6>
      );
    },
    hr: ({ ...props }: any) => {
      return (
        <hr
          className="my-4 border-t border-zinc-300 dark:border-zinc-700"
          {...props}
        />
      );
    },
    ol: ({ children, ...props }: any) => {
      return (
        <ol className="ml-4 list-outside list-decimal space-y-2" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ children, ...props }: any) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      );
    },
    ul: ({ children, ...props }: any) => {
      return (
        <ul className="ml-4 list-outside list-disc space-y-2" {...props}>
          {children}
        </ul>
      );
    },
    strong: ({ children, ...props }: any) => {
      return (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      );
    },
    a: ({ href, children, ...props }: any) => {
      return (
        <Link
          className="inline-flex items-center justify-center gap-1 rounded-sm bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          target="_blank"
          rel="noreferrer"
          href={href}
          {...props}
        >
          <span className="flex items-center justify-center">{children}</span>
          <ExternalLinkIcon className="h-3 w-3" />
        </Link>
      );
    },
    table: MarkdownTable,
    thead: ({ children, ...props }: any) => {
      return (
        <thead className="bg-zinc-100 dark:bg-zinc-800" {...props}>
          {children}
        </thead>
      );
    },
    tbody: ({ children, ...props }: any) => {
      return <tbody {...props}>{children}</tbody>;
    },
    tr: ({ children, ...props }: any) => {
      return (
        <tr
          className="border-b border-zinc-300 dark:border-zinc-700"
          {...props}
        >
          {children}
        </tr>
      );
    },
    th: ({ children, ...props }: any) => {
      return (
        <th
          className="border-r border-zinc-300 px-4 py-2 text-left font-semibold dark:border-zinc-700"
          {...props}
        >
          {children}
        </th>
      );
    },
    td: ({ children, ...props }: any) => {
      return (
        <td
          className="border-r border-zinc-300 px-4 py-2 dark:border-zinc-700"
          {...props}
        >
          {children}
        </td>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
