'use client';
import { useEffect, useState } from 'react';
export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem('umar-platform-theme'); if (saved === 'light') { setLight(true); document.documentElement.dataset.theme = 'light'; } } catch { /* Optional preference. */ } }, []);
  function toggle() { const next = !light; setLight(next); document.documentElement.dataset.theme = next ? 'light' : 'dark'; try { localStorage.setItem('umar-platform-theme', next ? 'light' : 'dark'); } catch { /* Theme still applies for this page view. */ } }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={`Switch to ${light ? 'dark' : 'light'} theme`} title="Toggle theme">{light ? '◑' : '◐'}</button>;
}
