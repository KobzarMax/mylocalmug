import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';

const copiedFeedbackDuration = 2000;

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async (value: string) => {
    const saved = await Clipboard.setStringAsync(value);
    if (!saved) throw new Error('The invitation code could not be copied.');

    if (resetTimer.current) clearTimeout(resetTimer.current);
    setCopied(true);
    resetTimer.current = setTimeout(() => {
      setCopied(false);
      resetTimer.current = null;
    }, copiedFeedbackDuration);
  };

  return { copied, copy };
}
