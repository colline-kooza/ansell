"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3, HighlighterIcon, Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-[11px] transition-all",
        active
          ? "bg-gray-900 text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="h-5 w-px bg-gray-200 mx-0.5" />;
}

export function RichEditor({ value, onChange, placeholder, className, maxLength }: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "bg-gray-100 rounded p-3 text-[12px] font-mono" } },
        blockquote: { HTMLAttributes: { class: "border-l-4 border-primary/40 pl-4 italic text-gray-600" } },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full my-2" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder || "Start writing..." }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-[13px] text-gray-800 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Keep content synced with value prop
  React.useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  if (!editor) return null;

  const charCount = maxLength ? editor.storage.characterCount?.characters() : null;

  return (
    <div className={cn("border border-gray-200 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
        {/* History */}
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text style */}
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <HighlighterIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Links & Images */}
        <ToolbarButton title="Add Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Add Image" onClick={addImage}>
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Footer with char count */}
      {maxLength && charCount !== null && (
        <div className="flex justify-end px-3 py-1.5 border-t border-gray-100 bg-gray-50/50">
          <span className={cn("text-[10px]", charCount > maxLength * 0.9 ? "text-amber-500" : "text-gray-400")}>
            {charCount} / {maxLength}
          </span>
        </div>
      )}

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9CA3AF;
          pointer-events: none;
          height: 0;
          font-size: 13px;
        }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 600; margin: 0.875rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror blockquote { border-left: 3px solid #0c4a2a40; padding-left: 1rem; color: #6B7280; font-style: italic; margin: 0.5rem 0; }
        .ProseMirror code { background: #F3F4F6; border-radius: 3px; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.85em; }
        .ProseMirror pre { background: #F3F4F6; border-radius: 6px; padding: 0.75rem 1rem; }
        .ProseMirror hr { border: none; border-top: 1px solid #E5E7EB; margin: 1rem 0; }
        .ProseMirror a { color: var(--color-primary, #0c4a2a); text-decoration: underline; }
        .ProseMirror mark { background-color: #fef08a; border-radius: 2px; padding: 0 1px; }
        .ProseMirror img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
      `}</style>
    </div>
  );
}

// ── RichContent: safe renderer ─────────────────────────────────────────

export function RichContent({ html, className }: { html?: string; className?: string }) {
  if (!html) return null;
  // Sanitise with DOMPurify on client
  let safe = html;
  if (typeof window !== "undefined") {
    try {
      const DOMPurify = require("dompurify");
      safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    } catch {
      // fallback: strip script tags manually
      safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    }
  }
  return (
    <>
      <div
        className={cn("rich-content text-[13px] text-gray-700 leading-relaxed", className)}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
      <style>{`
        .rich-content h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #111827; }
        .rich-content h2 { font-size: 1.25rem; font-weight: 600; margin: 0.875rem 0 0.5rem; color: #111827; }
        .rich-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; color: #111827; }
        .rich-content p { margin: 0.4rem 0; }
        .rich-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-content li { margin: 0.2rem 0; }
        .rich-content blockquote { border-left: 3px solid #0c4a2a40; padding-left: 1rem; color: #6B7280; font-style: italic; margin: 0.75rem 0; }
        .rich-content code { background: #F3F4F6; border-radius: 3px; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.85em; }
        .rich-content pre { background: #F3F4F6; border-radius: 6px; padding: 0.75rem 1rem; overflow-x: auto; margin: 0.75rem 0; }
        .rich-content hr { border: none; border-top: 1px solid #E5E7EB; margin: 1rem 0; }
        .rich-content a { color: var(--color-primary, #0c4a2a); text-decoration: underline; }
        .rich-content mark { background-color: #fef08a; border-radius: 2px; padding: 0 1px; }
        .rich-content img { max-width: 100%; border-radius: 6px; margin: 0.75rem 0; }
        .rich-content strong { font-weight: 600; }
        .rich-content em { font-style: italic; }
        .rich-content s { text-decoration: line-through; }
      `}</style>
    </>
  );
}
