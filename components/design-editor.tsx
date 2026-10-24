'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { PortfolioRenderer } from '@/components/portfolio-renderer';
import { createClient } from '@/lib/supabase/client';
import { siteUrl } from '@/lib/config';

const accents = ['#A3FF70', '#8BB8FF', '#D9A8FF', '#FFB38A', '#F4D35E'];
type Data = Record<string, any>;

export function DesignEditor({ userId, portfolio, settings }: { userId: string; portfolio: Data; settings: Data }) {
  const [template, setTemplate] = useState(settings.template || 'minimal');
  const [appearance, setAppearance] = useState(settings.appearance || 'dark');
  const [accent, setAccent] = useState(settings.accent_color || accents[0]);
  const [published, setPublished] = useState(Boolean(settings.is_published));
  const [seoTitle, setSeoTitle] = useState(settings.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(settings.seo_description || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();

  async function saveSettings(supabase: ReturnType<typeof createClient>) {
    const { error } = await supabase.from('portfolio_settings').update({
      template, appearance, accent_color: accent,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    }).eq('owner_id', userId);
    if (error) throw error;
  }

  async function saveDraft() {
    setBusy(true); setError(''); setNotice('');
    try {
      await saveSettings(createClient());
      setNotice(published ? 'Draft design saved. Your public version is unchanged until you publish updates.' : 'Draft design saved.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your design.');
    } finally { setBusy(false); }
  }

  async function publish() {
    const profile = portfolio.profile;
    if (!profile?.display_name || !profile?.headline || !profile?.bio) {
      setError('Add your display name, headline, and introduction in Profile before publishing.');
      return;
    }
    const question = published
      ? 'Publish these updates? Visitors will see this version of your profile and public projects.'
      : 'Publish this portfolio? Your profile and public projects will be visible to anyone with the link.';
    if (!window.confirm(question)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const supabase = createClient();
      await saveSettings(supabase);
      const { error } = await supabase.rpc('publish_my_portfolio');
      if (error) throw error;
      setPublished(true);
      setNotice(published ? 'Portfolio updates published.' : 'Portfolio published.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not publish. Your previous public version remains unchanged.');
    } finally { setBusy(false); }
  }

  async function unpublish() {
    if (!window.confirm('Unpublish this portfolio? Its public link will stop displaying your content.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error } = await createClient().rpc('unpublish_my_portfolio');
      if (error) throw error;
      setPublished(false); setNotice('Portfolio unpublished.'); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not unpublish right now.');
    } finally { setBusy(false); }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/u/${portfolio.profile.username}`);
      setNotice('Live portfolio link copied.');
    } catch { setError('Could not access the clipboard. Copy the URL from the dashboard.'); }
  }

  const preview = { ...portfolio, settings: { ...portfolio.settings, template, appearance, accent_color: accent, seo_title: seoTitle, seo_description: seoDescription } };
  return <div className="design-workspace">
    <section className="design-controls">
      <div className="form-section-heading"><div><p className="eyebrow">PRESENTATION / PUBLISHING</p><h2>Make it feel like you.</h2></div><span className={`publish-badge ${published ? 'published' : ''}`}><i/> {published ? 'PUBLISHED' : 'DRAFT'}</span></div>
      <label>Portfolio template<span className="field-hint">Content stays the same when you switch</span><select value={template} onChange={event => setTemplate(event.target.value)}><option value="minimal">Minimal — editorial and calm</option><option value="developer">Developer — technical and precise</option><option value="creative">Creative — expressive and visual</option></select></label>
      <fieldset className="appearance-options"><legend>Appearance</legend>{['dark', 'light'].map(option => <label key={option} className={`radio-card ${appearance === option ? 'selected' : ''}`}><input type="radio" name="appearance" value={option} checked={appearance === option} onChange={() => setAppearance(option)}/><span>{option === 'dark' ? 'Dark' : 'Light'}</span></label>)}</fieldset>
      <label>Search preview title<span className="field-hint">Optional · up to 70 characters</span><input value={seoTitle} onChange={event => setSeoTitle(event.target.value.slice(0, 70))} maxLength={70} placeholder={portfolio.profile.display_name ? `${portfolio.profile.display_name} — Developer portfolio` : ''}/></label>
      <label>Search description<span className="field-hint">Optional · up to 180 characters</span><textarea value={seoDescription} onChange={event => setSeoDescription(event.target.value.slice(0, 180))} maxLength={180} rows={3} placeholder={portfolio.profile.headline || 'A short introduction to your work.'}/></label>
      <fieldset className="accent-options"><legend>Accent color</legend><div>{accents.map(color => <button key={color} type="button" aria-label={`Use accent ${color}`} aria-pressed={accent === color} onClick={() => setAccent(color)} style={{ '--swatch': color } as CSSProperties}/>)}</div></fieldset>
      <p className="design-note">Preview uses your current draft, including private projects. Private projects stay out of the public page. Publishing saves a separate public snapshot.</p>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
      <div className="design-actions"><button className="button" disabled={busy} onClick={saveDraft}>{busy ? 'Saving…' : 'Save draft design'} <span>→</span></button>
        {published ? <><button className="button button-outline" disabled={busy} onClick={publish}>Publish updates <span>↗</span></button><button className="button button-outline" onClick={copy}>Copy live link</button><button className="text-button danger-text" disabled={busy} onClick={unpublish}>Unpublish</button></> : <button className="button button-outline" disabled={busy} onClick={publish}>Publish portfolio <span>↗</span></button>}
      </div>
    </section>
    <section className="design-preview"><div className="preview-label"><span>LIVE PREVIEW / {published ? 'DRAFT CHANGES · PUBLIC VERSION UNCHANGED' : 'UNPUBLISHED DRAFT'}</span><span>{template.toUpperCase()}</span></div><PortfolioRenderer portfolio={preview} preview/></section>
  </div>;
}
