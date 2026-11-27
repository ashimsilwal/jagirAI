'use client';

import React, { useMemo, useRef, useCallback } from 'react';
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

  // Hook to attach event listeners to Jodit instance
  const handleEditorRef = useCallback((editorInstance: any) => {
    editorRef.current = editorInstance;
    if (!editorInstance) return;

    // Preserve text alignment (center, right, etc.) when converting text to list items
    editorInstance.e?.on?.('commitStyleBeforeWrapList', (_mode: any, wrapper: HTMLElement) => {
      if (!wrapper || !editorInstance.createInside) return undefined;
      const li = editorInstance.createInside.element('li');
      while (wrapper.firstChild) {
        li.appendChild(wrapper.firstChild);
      }
      if (wrapper.attributes) {
        for (let i = 0; i < wrapper.attributes.length; i++) {
          const attr = wrapper.attributes[i];
          li.setAttribute(attr.name, attr.value);
        }
      }
      const textAlign = wrapper.style?.textAlign || wrapper.getAttribute('align');
      if (textAlign) {
        li.style.textAlign = textAlign;
      }
      if (wrapper.parentNode) {
        wrapper.parentNode.replaceChild(li, wrapper);
      }
      return li;
    });

    // Handle main toolbar alignment controls when an image is selected
    editorInstance.e?.on?.('beforeCommand', (command: string) => {
      const selected = editorInstance.s?.current?.();
      let img: HTMLImageElement | null = selected?.tagName === 'IMG' ? selected : null;
      if (!img && editorInstance.editor) {
        img = editorInstance.editor.querySelector('.jodit_selected_image') ||
              editorInstance.editor.querySelector('img.jodit-focused') ||
              null;
      }
      if (!img && editorInstance.editor) {
        const resizer = editorInstance.editor.querySelector('.jodit-resizer_active');
        if (resizer && resizer.previousElementSibling?.tagName === 'IMG') {
          img = resizer.previousElementSibling as HTMLImageElement;
        }
      }

      if (img && img.tagName === 'IMG') {
        const cmd = (command || '').toLowerCase();
        if (cmd === 'justifyleft') {
          img.style.float = 'left';
          img.style.display = 'block';
          img.style.marginLeft = '0px';
          img.style.marginRight = '1.5rem';
          img.style.marginBottom = '1rem';
          editorInstance.synchronizeValues();
          editorInstance.e?.fire?.('recalcPositionPopup');
          return false;
        }
        if (cmd === 'justifycenter') {
          img.style.float = 'none';
          img.style.display = 'block';
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          img.style.marginBottom = '1.25rem';
          editorInstance.synchronizeValues();
          editorInstance.e?.fire?.('recalcPositionPopup');
          return false;
        }
        if (cmd === 'justifyright') {
          img.style.float = 'right';
          img.style.display = 'block';
          img.style.marginLeft = '1.5rem';
          img.style.marginRight = '0px';
          img.style.marginBottom = '1rem';
          editorInstance.synchronizeValues();
          editorInstance.e?.fire?.('recalcPositionPopup');
          return false;
        }
        if (cmd === 'justifyfull') {
          img.style.float = '';
          img.style.display = '';
          img.style.marginLeft = '';
          img.style.marginRight = '';
          img.style.marginBottom = '';
          editorInstance.synchronizeValues();
          editorInstance.e?.fire?.('recalcPositionPopup');
          return false;
        }
      }
      return undefined;
    });
  }, []);

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
        image: {
          tooltip: 'Insert Image (Click image to resize or double-click to set exact height & width)',
        },
      },
      // Resizer configuration: allows adjustable height and width via drag handles without forced aspect ratio locking
      resizer: {
        showSize: true,
        hideSizeTimeout: 1500,
        forImageChangeAttributes: false, // Applies inline CSS styles (style="height:...px; width:...px;") directly
        useAspectRatio: false, // Allows user to independently adjust image height and width
        min_width: 20,
        min_height: 20,
      },
      // Image properties dialog: user can determine exact height and width in pixels
      image: {
        dialogWidth: 600,
        openOnDblClick: true,
        editSrc: true,
        useImageEditor: true,
        editTitle: true,
        editAlt: true,
        editLink: true,
        editSize: true, // Enables explicit width and height numeric inputs in Image Properties modal
        editBorderRadius: true,
        editMargins: true,
        editClass: true,
        editStyle: true,
        editId: true,
        editAlign: true,
        showPreview: true,
        selectImageAfterClose: true,
      },
      // Inline popup shown when clicking an image inside the editor
      popup: {
        img: [
          'pencil', // Opens Image Properties dialog to adjust height & width numerically
          '|',
          {
            name: 'align_left',
            icon: 'left',
            tooltip: 'Align Left (Float Left)',
            exec: (editor: any, image: any) => {
              if (!image) return;
              image.style.float = 'left';
              image.style.display = 'block';
              image.style.marginLeft = '0px';
              image.style.marginRight = '1.5rem';
              image.style.marginBottom = '1rem';
              editor.synchronizeValues();
              editor.e.fire('recalcPositionPopup');
            },
          },
          {
            name: 'align_center',
            icon: 'center',
            tooltip: 'Align Center (Margin Auto)',
            exec: (editor: any, image: any) => {
              if (!image) return;
              image.style.float = 'none';
              image.style.display = 'block';
              image.style.marginLeft = 'auto';
              image.style.marginRight = 'auto';
              image.style.marginBottom = '1.25rem';
              editor.synchronizeValues();
              editor.e.fire('recalcPositionPopup');
            },
          },
          {
            name: 'align_right',
            icon: 'right',
            tooltip: 'Align Right (Float Right)',
            exec: (editor: any, image: any) => {
              if (!image) return;
              image.style.float = 'right';
              image.style.display = 'block';
              image.style.marginLeft = '1.5rem';
              image.style.marginRight = '0px';
              image.style.marginBottom = '1rem';
              editor.synchronizeValues();
              editor.e.fire('recalcPositionPopup');
            },
          },
          {
            name: 'align_normal',
            icon: 'justify',
            tooltip: 'Inline / Normal Alignment',
            exec: (editor: any, image: any) => {
              if (!image) return;
              image.style.float = '';
              image.style.display = '';
              image.style.marginLeft = '';
              image.style.marginRight = '';
              image.style.marginBottom = '';
              editor.synchronizeValues();
              editor.e.fire('recalcPositionPopup');
            },
          },
          '|',
          'valign',
          '|',
          'delete',
        ],
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
        ref={handleEditorRef}
        value={value}
        config={config as any}
        onBlur={(newContent) => onChange(newContent)}
        onChange={(newContent) => onChange(newContent)}
      />
    </div>
  );
};



