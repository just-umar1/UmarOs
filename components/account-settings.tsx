'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AccountSettings({ email, userId }: { email: string; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nextEmail = String(form.get('email') || '').trim();
    if (!nextEmail || nextEmail.length > 254) {
      setError('Enter a valid email address.'); setBusy(false); return;
    }
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard/settings` },
      );
      if (updateError) throw updateError;
      setMessage('Check your inbox to confirm the new address. Your sign-in email changes after confirmation.');
      formElement.reset();
    } catch {
      setError('We could not start the email change. Check the address and try again.');
    } finally { setBusy(false); }
  }

  async function collectFolder(supabase: ReturnType<typeof createClient>, folder: string, paths: string[]) {
    let offset = 0;
    for (;;) {
      const { data, error: listError } = await supabase.storage.from('portfolio-assets').list(folder, { limit: 1000, offset });
      if (listError) throw listError;
      const entries = data || [];
      for (const item of entries) {
        const path = `${folder}/${item.name}`;
        if (item.id === null) await collectFolder(supabase, path, paths);
        else paths.push(path);
      }
      if (entries.length < 1000) break;
      offset += entries.length;
    }
  }

  async function removeAccount() {
    if (!window.confirm('Delete your account and portfolio data? This cannot be undone. Your portfolio and profile will be removed.')) return;
    setBusy(true); setDeleteError('');
    try {
      const supabase = createClient();
      const paths: string[] = [];
      await collectFolder(supabase, userId, paths);
      for (let i = 0; i < paths.length; i += 100) {
        const { error: removeError } = await supabase.storage.from('portfolio-assets').remove(paths.slice(i, i + 100));
        if (removeError) throw removeError;
      }
      const { error: deleteError } = await supabase.rpc('delete_my_account');
      if (deleteError) throw deleteError;
      router.replace('/?account=deleted'); router.refresh();
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'Account deletion could not be completed. Your account was not removed.');
    } finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setError('');
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace('/'); router.refresh();
    } catch {
      setError('Could not sign out. Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="settings-sections">
    <section className="settings-card">
      <p className="eyebrow">ACCOUNT</p><h2>Sign-in details</h2>
      <dl><div><dt>Current email address</dt><dd>{email}</dd></div></dl>
      <form className="editor-form account-email-form" onSubmit={changeEmail}>
        <label htmlFor="account-email">Change sign-in email</label>
        <input id="account-email" name="email" type="email" maxLength={254} autoComplete="email" required placeholder="name@example.com" />
        <p className="muted-copy">Supabase sends a confirmation link before applying the change.</p>
        <button className="button button-outline" disabled={busy}>{busy ? 'Please wait…' : 'Send confirmation'}</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button button-outline" disabled={busy} onClick={signOut}>Sign out</button>
    </section>
    <section className="settings-card privacy-settings">
      <p className="eyebrow">VISIBILITY</p><h2>You choose what is public.</h2>
      <p>Your profile and projects remain private until you publish. Public email and Explore listing are controlled in the Profile editor.</p>
      <a className="text-link" href="/dashboard/editor">Review profile visibility ↗</a>
      <a className="text-link" href="/dashboard/design">Unpublish portfolio ↗</a>
    </section>
    <section className="settings-card destructive-settings">
      <p className="eyebrow">IRREVERSIBLE ACTION</p><h2>Delete account</h2>
      <p>This removes your auth account, profile, settings, projects, and owned portfolio images. Backups follow your Supabase project’s retention policies.</p>
      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
      <button className="button button-danger" disabled={busy} onClick={removeAccount}>{busy ? 'Working…' : 'Delete my account'}</button>
    </section>
  </div>;
}
