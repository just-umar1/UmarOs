import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader({ dashboard = false }: { dashboard?: boolean }) {
  return <><a className="skip-link" href="#main-content">Skip to content</a><header className="site-header">
    <Link className="brand" href="/" aria-label="UMAR.OS home"><span className="brand-mark">U<span>.</span></span><span>UMAR<span className="muted">.OS</span></span></Link>
    <nav className="main-nav" aria-label="Main navigation">
      {dashboard ? <><Link href="/dashboard">Overview</Link><Link href="/dashboard/editor">Profile</Link><Link href="/dashboard/projects">Projects</Link><Link href="/dashboard/design">Design</Link></> : <><Link href="/#how-it-works">How it works</Link><Link href="/explore">Explore</Link><Link href="/#features">Features</Link></>}
    </nav>
    <div className="header-actions"><ThemeToggle />{dashboard ? <Link className="button button-small button-outline" href="/dashboard/settings">Settings</Link> : <><Link className="text-link desktop-only" href="/login">Log in</Link><Link className="button button-small" href="/signup">Get started <span aria-hidden="true">↗</span></Link></>}</div>
    <details className="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span></summary><nav aria-label="Mobile navigation">{dashboard ? <><Link href="/dashboard">Overview</Link><Link href="/dashboard/editor">Profile</Link><Link href="/dashboard/projects">Projects</Link><Link href="/dashboard/design">Design</Link><Link href="/dashboard/settings">Settings</Link></> : <><Link href="/#how-it-works">How it works</Link><Link href="/explore">Explore portfolios</Link><Link href="/#features">Features</Link><Link href="/login">Log in</Link><Link href="/signup">Create your portfolio</Link></>}</nav></details>
  </header></>;
}
