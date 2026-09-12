import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  FileCode,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
  Save,
  X,
  Eye,
  Columns,
  Loader2
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Lesson } from '../../services/docsService';

interface RichMarkdownEditorProps {
  lesson: Lesson;
  onSave: (updates: { title: string; content: string }) => Promise<void>;
  onCancel: () => void;
}

export const RichMarkdownEditor: React.FC<RichMarkdownEditorProps> = ({
  lesson,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(lesson.title);
    setContent(lesson.content);
    setHasChanges(false);
  }, [lesson]);

  const handleContentChange = (val: string) => {
    setContent(val);
    setHasChanges(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setHasChanges(true);
  };

  // Insert or wrap text around selection
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;

    const newContent =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newContent);
    setHasChanges(true);

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  // Prefix lines (for lists, quotes, headings)
  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;

    const newContent =
      content.substring(0, lineStart) +
      prefix +
      content.substring(lineStart);

    setContent(newContent);
    setHasChanges(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + S to Save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Cmd/Ctrl + B for Bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'bold text');
      return;
    }

    // Cmd/Ctrl + I for Italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'italic text');
      return;
    }

    // Tab key inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setStatusMessage('Please provide a lesson title.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSave({
        title: title.trim(),
        content
      });
      setHasChanges(false);
      setStatusMessage('Changes saved to database.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden select-none">
      {/* Top Header: Title, Mode Toggles, Save / Exit */}
      <header className="h-12 bg-[#0A0A0A] border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0 space-x-3">
        {/* Title Input */}
        <div className="flex-1 max-w-xl flex items-center space-x-2">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Lesson Title..."
            className="w-full text-sm font-semibold bg-transparent text-white border-b border-white/20 focus:border-white focus:outline-none px-1 py-0.5 transition-colors"
          />
          {hasChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
          )}
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {statusMessage && (
            <span className="text-[11px] font-mono text-zinc-400 mr-2 animate-in fade-in">
              {statusMessage}
            </span>
          )}

          {/* View Mode Switches */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              title="Editor only"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'edit' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              title="Split view (Edit and Preview)"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'split' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              title="Rendered preview"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'preview' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center space-x-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Formatting Toolbar */}
      {viewMode !== 'preview' && (
        <div className="h-10 bg-zinc-950 border-b border-white/[0.08] px-3 flex items-center space-x-1 overflow-x-auto shrink-0 text-zinc-400">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertLinePrefix('# ')}
            title="Heading 1 (#)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('## ')}
            title="Heading 2 (##)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('### ')}
            title="Heading 3 (###)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            title="Bold (**text**)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            title="Italic (*text*)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
            title="Strikethrough (~~text~~)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => insertLinePrefix('- ')}
            title="Bulleted list (- item)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            title="Numbered list (1. item)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('- [ ] ')}
            title="Checklist (- [ ] task)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Code */}
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'inline code')}
            title="Inline code (`code`)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n```bash\n', '\n```\n', '# Terminal command or code')}
            title="Code block (```lang)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Blocks & Extras */}
          <button
            type="button"
            onClick={() => insertFormatting('> [!NOTE]\n> ', '\n', 'Important note for trainees')}
            title="Note Callout Box (> [!NOTE])"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertFormatting(
                '\n| Step | Description | Status |\n|---|---|---|\n| 1 | Connect XLR | Pending |\n'
              )
            }
            title="Markdown Table"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('[', '](https://example.com)', 'link text')}
            title="Hyperlink ([text](url))"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n---\n')}
            title="Horizontal divider (---)"
            className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor & Preview Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Source Textarea */}
        {viewMode !== 'preview' && (
          <div
            className={`h-full flex flex-col ${
              viewMode === 'split' ? 'w-1/2 border-r border-white/[0.08]' : 'w-full'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write lesson markdown here..."
              className="w-full flex-1 p-6 bg-black text-zinc-200 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder-zinc-600"
              spellCheck={false}
            />
          </div>
        )}

        {/* Rendered Preview Pane */}
        {viewMode !== 'edit' && (
          <div
            className={`h-full overflow-y-auto p-6 bg-[#070707] ${
              viewMode === 'split' ? 'w-1/2' : 'w-full max-w-4xl mx-auto'
            }`}
          >
            <div className="mb-4 pb-2 border-b border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                Preview Mode
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">{title || 'Untitled Lesson'}</h1>
            </div>
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </div>
  );
};
