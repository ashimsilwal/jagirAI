'use client';

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';
import 'jodit/es2021/jodit.min.css';

// Dynamic import JoditEditor for Next.js SSR compatibility
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading Jodit WYSIWYG Editor...</span>
      </div>
    </div>
  ),
});

interface JoditEditorWrapperProps {
  value: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const JoditEditorWrapper: React.FC<JoditEditorWrapperProps> = ({
  value,
  onChange,
  placeholder = 'Write or paste your article content here...',
  minHeight = 480,
}) => {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const config = useMemo(() => {
    return {
      readonly: false,
      placeholder,
      minHeight,
      theme: theme === 'dark' ? 'dark' : 'default',
      toolbarAdaptive: false,
      toolbarSticky: true,
      toolbarStickyOffset: 65,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html',
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'ul',
        'ol',
        '|',
        'paragraph',
        'fontsize',
        'brush',
        '|',
        'table',
        'link',
        'image',
        'video',
        '|',
        'align',
        'outdent',
        'indent',
        '|',
        'superscript',
        'subscript',
        '|',
        'hr',
        'eraser',
        '|',
        'undo',
        'redo',
        '|',
        'source',
        'fullsize',
      ],
      buttonsMD: [
        'bold',
        'italic',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        'paragraph',
        'table',
        'link',
        'image',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'source',
      ],
      buttonsSM: [
        'bold',
        'italic',
        '|',
        'ul',
        'ol',
        '|',
        'paragraph',
        'table',
        'link',
        '|',
        'undo',
        'redo',
      ],
      buttonsXS: [
        'bold',
        'italic',
        '|',
        'ul',
        'ol',
        '|',
        'paragraph',
        'table',
      ],
      controls: {
        ul: {
          tooltip: 'Bullet List (Click for bullet list, or dropdown for disc, circle, square)',
        },
        ol: {
          tooltip: 'Numbered List (Click for 1, 2, 3...)',
        },
      },
      table: {
        allowCellSelection: true,
      },
      uploader: {
        insertImageAsBase64URI: true,
      },
    };
  }, [theme, placeholder, minHeight]);

  return (
    <div className="jodit-wysiwyg-wrapper rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
      <JoditEditor
        ref={editorRef}
        value={value}
        config={config as any}
        onBlur={(newContent) => onChange(newContent)}
        onChange={(newContent) => onChange(newContent)}
      />
    </div>
  );
};


