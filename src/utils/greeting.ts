import { useState, useEffect } from 'react';

/**
 * Calculates the time-of-day greeting based on browser local time.
 *
 * Local Time Ranges:
 * 00:00–04:59 → "Good night"
 * 05:00–11:59 → "Good morning"
 * 12:00–16:59 → "Good afternoon"
 * 17:00–20:59 → "Good evening"
 * 21:00–23:59 → "Good night"
 */
export function getTimeOfDayGreeting(date: Date = new Date()): string {
  const hours = date.getHours();
  // 05:00 - 11:59
  if (hours >= 5 && hours < 12) {
    return 'Good morning';
  }
  // 12:00 - 16:59
  if (hours >= 12 && hours < 17) {
    return 'Good afternoon';
  }
  // 17:00 - 20:59
  if (hours >= 17 && hours < 21) {
    return 'Good evening';
  }
  // 21:00 - 23:59 and 00:00 - 04:59
  return 'Good night';
}

export interface FormattedGreeting {
  timeGreeting: string;
  hasName: boolean;
  displayName: string | null;
  /**
   * Line 1 of greeting:
   * If name: "Good afternoon, {Name}."
   * Fallback: "Good afternoon 👋"
   */
  greetingLine: string;
  /**
   * Line 2: "Let's move your job search forward."
   */
  subheadingLine: string;
  /**
   * Full semantic sentence for screen readers and ARIA labels.
   */
  fullAccessibleText: string;
}

/**
 * Formats a personalized or fallback greeting string safely.
 * Handles missing, null, undefined, and whitespace-only names.
 */
export function formatGreeting(timeGreeting: string, rawName?: string | null): FormattedGreeting {
  const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
  const hasValidName =
    trimmedName.length > 0 &&
    trimmedName.toLowerCase() !== 'null' &&
    trimmedName.toLowerCase() !== 'undefined';
  const subheadingLine = "Let's move your job search forward.";

  if (hasValidName) {
    // Prevent double punctuation if user name ends with a period
    const cleanName = trimmedName.endsWith('.') ? trimmedName.slice(0, -1).trim() : trimmedName;
    const greetingLine = `${timeGreeting}, ${cleanName}.`;
    return {
      timeGreeting,
      hasName: true,
      displayName: cleanName,
      greetingLine,
      subheadingLine,
      fullAccessibleText: `${greetingLine} ${subheadingLine}`,
    };
  }

  // Fallback with wave emoji when no name is provided
  const greetingLine = `${timeGreeting} 👋`;
  return {
    timeGreeting,
    hasName: false,
    displayName: null,
    greetingLine,
    subheadingLine,
    fullAccessibleText: `${timeGreeting}. ${subheadingLine}`,
  };
}

/**
 * Reusable React hook for time-aware and user-personalized dashboard greeting.
 * Automatically updates when local browser time crosses boundaries (e.g. 11:59 -> 12:00)
 * or when the user wakes the device / focuses the tab.
 */
export function useTimeGreeting(rawName?: string | null): FormattedGreeting {
  const [timeGreeting, setTimeGreeting] = useState<string>(() => getTimeOfDayGreeting());

  useEffect(() => {
    const checkTimeBoundary = () => {
      const currentGreeting = getTimeOfDayGreeting();
      setTimeGreeting((prev) => (prev !== currentGreeting ? currentGreeting : prev));
    };

    // Initial check on mount
    checkTimeBoundary();

    // Check periodically every 30 seconds for boundary changes
    const intervalId = setInterval(checkTimeBoundary, 30000);

    // Immediate check on tab focus or visibility change (e.g. opening lid after sleep)
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkTimeBoundary();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  return formatGreeting(timeGreeting, rawName);
}

// Alias for flexibility
export const useGreeting = useTimeGreeting;
