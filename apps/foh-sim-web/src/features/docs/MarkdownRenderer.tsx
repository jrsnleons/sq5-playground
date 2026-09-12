import React, { useState } from 'react';
import { Copy, Check, Info, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content.trim()) {
    return (
      <div className="py-12 text-center text-zinc-500 font-mono text-xs">
        This lesson has no content written yet.
      </div>
    );
  }

  // Parse lines into structured blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index++;
      }
      index++; // consume closing ```
      const codeText = codeLines.join('\n');
      elements.push(<CodeBlock key={`code-${index}`} code={codeText} language={language} />);
      continue;
    }

    // Callout Quote Block or Standard Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith('>')) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''));
        index++;
      }
      const rawText = quoteLines.join('\n');
      elements.push(<CalloutBlock key={`quote-${index}`} text={rawText} />);
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('|') && lines[index].trim().endsWith('|')) {
        tableLines.push(lines[index].trim());
        index++;
      }
      elements.push(<TableBlock key={`table-${index}`} lines={tableLines} />);
      continue;
    }

    // Horizontal Rule
    if (/^(---+|___+|\*\*\*+)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${index}`} className="my-6 border-white/[0.08]" />);
      index++;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      const text = line.slice(2);
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl sm:text-2xl font-bold text-white mt-8 mb-4 tracking-tight border-b border-white/[0.08] pb-2">
          {renderInline(text)}
        </h1>
      );
      index++;
      continue;
    }
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg sm:text-xl font-semibold text-zinc-100 mt-6 mb-3 tracking-tight">
          {renderInline(text)}
        </h2>
      );
      index++;
      continue;
    }
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      elements.push(
        <h3 key={`h3-${index}`} className="text-sm sm:text-base font-semibold text-zinc-200 mt-5 mb-2 tracking-tight">
          {renderInline(text)}
        </h3>
      );
      index++;
      continue;
    }

    // Unordered List & Task List
    if (/^\s*[-*+]\s/.test(line)) {
      const listItems: { text: string; isTask?: boolean; isChecked?: boolean }[] = [];
      while (index < lines.length && /^\s*[-*+]\s/.test(lines[index])) {
        const itemLine = lines[index].replace(/^\s*[-*+]\s/, '');
        if (itemLine.startsWith('[ ] ') || itemLine.startsWith('[x] ') || itemLine.startsWith('[X] ')) {
          const isChecked = itemLine.startsWith('[x] ') || itemLine.startsWith('[X] ');
          listItems.push({ text: itemLine.slice(4), isTask: true, isChecked });
        } else {
          listItems.push({ text: itemLine });
        }
        index++;
      }
      elements.push(
        <ul key={`ul-${index}`} className="my-3 space-y-1.5 pl-5 text-xs text-zinc-300">
          {listItems.map((li, i) => (
            <li key={i} className={li.isTask ? 'flex items-start space-x-2 list-none -ml-5' : 'list-disc'}>
              {li.isTask ? (
                <>
                  <input
                    type="checkbox"
                    readOnly
                    checked={li.isChecked}
                    className="mt-0.5 rounded border-white/20 bg-zinc-900 text-white focus:ring-0 cursor-default"
                  />
                  <span className={li.isChecked ? 'line-through text-zinc-500' : ''}>
                    {renderInline(li.text)}
                  </span>
                </>
              ) : (
                <span>{renderInline(li.text)}</span>
              )}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered List
    if (/^\s*\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*\d+\.\s/, ''));
        index++;
      }
      elements.push(
        <ol key={`ol-${index}`} className="my-3 space-y-1.5 pl-5 text-xs text-zinc-300 list-decimal">
          {listItems.map((item, i) => (
            <li key={i} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      index++;
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${index}`} className="my-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
        {renderInline(line)}
      </p>
    );
    index++;
  }

  return <div className={`docs-content font-sans ${className}`}>{elements}</div>;
};

// Inline Markdown (Bold, Italic, Code, Links)
function renderInline(text: string): React.ReactNode {
  // Regex to match inline tokens
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold italic ***text***
    const biMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (biMatch) {
      parts.push(<strong key={keyIndex++} className="font-bold italic text-white">{biMatch[1]}</strong>);
      remaining = remaining.slice(biMatch[0].length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={keyIndex++} className="font-semibold text-white">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      parts.push(<em key={keyIndex++} className="italic text-zinc-200">{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={keyIndex++} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 font-mono text-[11px] text-zinc-200">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={keyIndex++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors font-medium"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      parts.push(<del key={keyIndex++} className="line-through text-zinc-500">{strikeMatch[1]}</del>);
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Normal text chunk up to next special char
    const nextSpecial = remaining.search(/[\*_`\[~]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

// Code Block with Copy Action
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg bg-zinc-950 border border-white/10 overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/60 border-b border-white/[0.08] text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-white/5 hover:text-white transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-[11px] text-zinc-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Callout / Blockquote
const CalloutBlock: React.FC<{ text: string }> = ({ text }) => {
  const isNote = text.startsWith('[!NOTE]') || text.startsWith('[!INFO]');
  const isTip = text.startsWith('[!TIP]');
  const isWarning = text.startsWith('[!WARNING]') || text.startsWith('[!CAUTION]');

  let cleanText = text;
  let type: 'note' | 'tip' | 'warning' | 'quote' = 'quote';

  if (isNote) {
    type = 'note';
    cleanText = text.replace(/^\[!(NOTE|INFO)\]\s*/i, '');
  } else if (isTip) {
    type = 'tip';
    cleanText = text.replace(/^\[!TIP\]\s*/i, '');
  } else if (isWarning) {
    type = 'warning';
    cleanText = text.replace(/^\[!(WARNING|CAUTION)\]\s*/i, '');
  }

  const styles = {
    note: 'bg-sky-950/30 border-sky-500/40 text-sky-200',
    tip: 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200',
    warning: 'bg-amber-950/30 border-amber-500/40 text-amber-200',
    quote: 'bg-zinc-950 border-white/20 text-zinc-300'
  }[type];

  const Icon = {
    note: Info,
    tip: Sparkles,
    warning: AlertTriangle,
    quote: null
  }[type];

  return (
    <div className={`my-4 p-3.5 rounded-lg border-l-4 text-xs leading-relaxed ${styles}`}>
      <div className="flex items-start space-x-2.5">
        {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">{renderInline(cleanText)}</div>
      </div>
    </div>
  );
};

// Table Renderer
const TableBlock: React.FC<{ lines: string[] }> = ({ lines }) => {
  if (lines.length < 2) return null;

  const parseRow = (row: string) =>
    row
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-zinc-900/80 border-b border-white/10 font-semibold text-zinc-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06] text-zinc-300 bg-zinc-950">
          {rows.map((r, ri) => (
            <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
              {r.map((c, ci) => (
                <td key={ci} className="px-3.5 py-2">
                  {renderInline(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
