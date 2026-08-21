import { RichText, Toolbar, useEditorBridge, useEditorContent } from '@10play/tentap-editor';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { ResolvedBusinessTheme } from '../../branding/types';
import { styles } from '../styles';
import { RichTextDocument } from '../types';

export function RichTextField({
  initialDocument,
  disabled,
  onChange,
}: {
  initialDocument: RichTextDocument;
  disabled: boolean;
  onChange: (document: RichTextDocument, text: string) => void;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const editor = useEditorBridge({
    initialContent: initialDocument,
    autofocus: false,
    avoidIosKeyboard: true,
    editable: !disabled,
    theme: { webview: { backgroundColor: palette.paper } },
  });
  const document = useEditorContent(editor, { type: 'json', debounceInterval: 300 });
  const text = useEditorContent(editor, { type: 'text', debounceInterval: 300 });
  useEffect(() => {
    if (document && typeof text === 'string') onChangeRef.current(document as RichTextDocument, text);
  }, [document, text]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Story</Text>
      <View style={styles.editorShell}>
        <RichText editor={editor} style={styles.editor} />
        <Toolbar editor={editor} hidden={disabled} />
      </View>
    </View>
  );
}

export function RichTextReader({
  document,
  theme,
}: {
  document: RichTextDocument;
  theme?: ResolvedBusinessTheme;
}) {
  const editor = useEditorBridge({
    initialContent: document,
    editable: false,
    dynamicHeight: true,
    theme: { webview: { backgroundColor: theme?.background ?? palette.cream } },
  });
  useEffect(() => {
    if (!theme) return;
    editor.injectCSS(
      `html, body { background: ${theme.background}; color: ${theme.text}; } body, p, li, h1, h2, h3, h4, h5, h6 { color: ${theme.text}; } a { color: ${theme.primary}; } blockquote { border-left-color: ${theme.accent}; color: ${theme.mutedText}; }`,
      'business-brand-reader',
    );
  }, [editor, theme]);
  return (
    <RichText
      editor={editor}
      scrollEnabled={false}
      style={[styles.reader, theme && { backgroundColor: theme.background }]}
    />
  );
}
