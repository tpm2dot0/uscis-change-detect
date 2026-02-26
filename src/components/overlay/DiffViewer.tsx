import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useMemo, type ReactNode } from 'react';
import { diffLines, type Change } from 'diff';
import { sortKeys } from '@/lib/diff';

interface DiffViewerProps {
  label: string;
  oldObj: unknown;
  newObj: unknown;
}

interface LinePair {
  left: string | null;
  right: string | null;
  type: 'unchanged' | 'added' | 'removed' | 'changed';
}

// ---------------------------------------------------------------------------
// Lightweight JSON syntax highlighter (no external deps)
// ---------------------------------------------------------------------------

const TOKEN_RE =
  /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|([-+]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],:])/g;

function highlightJson(line: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const m of line.matchAll(TOKEN_RE)) {
    const idx = m.index!;

    // Push any plain text before this match
    if (idx > lastIndex) {
      parts.push(line.slice(lastIndex, idx));
    }

    if (m[1] !== undefined) {
      // Key (string before colon)
      parts.push(
        <span key={idx} className="text-violet-700">{m[1]}</span>,
        line.slice(idx + m[1].length, idx + m[0].length), // the ":"
      );
    } else if (m[2] !== undefined) {
      // String value
      parts.push(<span key={idx} className="text-emerald-700">{m[2]}</span>);
    } else if (m[3] !== undefined) {
      // Number
      parts.push(<span key={idx} className="text-blue-700">{m[3]}</span>);
    } else if (m[4] !== undefined) {
      // Boolean
      parts.push(<span key={idx} className="text-orange-600">{m[4]}</span>);
    } else if (m[5] !== undefined) {
      // Null
      parts.push(<span key={idx} className="text-gray-400">{m[5]}</span>);
    } else if (m[6] !== undefined) {
      // Punctuation
      parts.push(<span key={idx} className="text-gray-500">{m[6]}</span>);
    }

    lastIndex = idx + m[0].length;
  }

  // Trailing text (whitespace / indentation)
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : line;
}

// ---------------------------------------------------------------------------
// Side-by-side diff logic
// ---------------------------------------------------------------------------

function buildLinePairs(changes: Change[]): LinePair[] {
  const pairs: LinePair[] = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const lines = change.value.replace(/\n$/, '').split('\n');

    if (!change.added && !change.removed) {
      for (const line of lines) {
        pairs.push({ left: line, right: line, type: 'unchanged' });
      }
    } else if (change.removed) {
      const next = changes[i + 1];
      if (next?.added) {
        const addedLines = next.value.replace(/\n$/, '').split('\n');
        const maxLen = Math.max(lines.length, addedLines.length);
        for (let j = 0; j < maxLen; j++) {
          pairs.push({
            left: j < lines.length ? lines[j] : null,
            right: j < addedLines.length ? addedLines[j] : null,
            type: 'changed',
          });
        }
        i++;
      } else {
        for (const line of lines) {
          pairs.push({ left: line, right: null, type: 'removed' });
        }
      }
    } else if (change.added) {
      for (const line of lines) {
        pairs.push({ left: null, right: line, type: 'added' });
      }
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiffViewer({ label, oldObj, newObj }: DiffViewerProps) {
  const [open, setOpen] = useState(true);

  const pairs = useMemo(() => {
    const oldStr = JSON.stringify(sortKeys(oldObj), null, 2) + '\n';
    const newStr = JSON.stringify(sortKeys(newObj), null, 2) + '\n';
    const changes = diffLines(oldStr, newStr);
    return buildLinePairs(changes);
  }, [oldObj, newObj]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium hover:underline">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 border bg-muted/30 text-xs font-mono leading-relaxed">
          <div className="grid grid-cols-2 divide-x">
            {/* Left column (previous) */}
            <div className="min-w-0 overflow-hidden">
              {pairs.map((pair, i) => (
                <div
                  key={i}
                  className={`px-2 whitespace-pre-wrap break-all ${
                    pair.left === null
                      ? 'bg-muted/20'
                      : pair.type === 'removed' || pair.type === 'changed'
                        ? 'bg-red-100/60'
                        : ''
                  }`}
                >
                  {pair.left !== null ? highlightJson(pair.left) : '\u00A0'}
                </div>
              ))}
            </div>
            {/* Right column (current) */}
            <div className="min-w-0 overflow-hidden">
              {pairs.map((pair, i) => (
                <div
                  key={i}
                  className={`px-2 whitespace-pre-wrap break-all ${
                    pair.right === null
                      ? 'bg-muted/20'
                      : pair.type === 'added' || pair.type === 'changed'
                        ? 'bg-green-100/60'
                        : ''
                  }`}
                >
                  {pair.right !== null ? highlightJson(pair.right) : '\u00A0'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
