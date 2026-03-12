import { useEffect, useState } from 'react';
import { parseTaggedText } from '../lib/richText';

export function useTextSegments(path) {
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadText() {
      if (!path) {
        setSegments([]);
        return;
      }

      setSegments([]);

      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error('Failed to load text');
        }

        const text = await response.text();
        if (!cancelled) {
          setSegments(parseTaggedText(text));
        }
      } catch {
        if (!cancelled) {
          setSegments([]);
        }
      }
    }

    loadText();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return segments;
}
