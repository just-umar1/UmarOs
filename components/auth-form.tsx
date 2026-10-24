'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath, validateUsername } from '@/lib/validation.mjs';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';
export function AuthForm({ mode }: { mode: Mode }) {
  const router=useRouter(),search=useSearchParams();const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const next=safeNextPath(search.get('next')||'/dashboard');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError('');setMessage('');setBusy(true);
    const data=new FormData(event.currentTarget);const email=String(data.get('email')||'').trim();const password=String(data.get('password')||'');
    try {
      const supabase=createClient();
      if(mode==='signup'){
        const username=String(data.get('username')||'').trim().toLowerCase();const validation=validateUsername(username);if(validation){setError(validation);return;}
        const {data:available,error:availabilityError}=await supabase.rpc('is_username_available',{p_username:username});if(availabilityError)throw availabilityError;if(!available){setError('That username is already in use. Try another one.');return;}
        const displayName=String(data.get('displayName')||'').trim();if(!displayName){setError('Enter your display name.');return;}
        const {data:result,error}=await supabase.auth.signUp({email,password,options:{data:{username,display_name:displayName},emailRedirectTo:`${location.origin}/auth/callback?next=/dashboard/onboarding`}});
        if(error)throw error;
        if(result.session){router.replace('/dashboard/onboarding');router.refresh();}else setMessage('Check your email for a verification link. Your account will be ready after you confirm it.');
      } else if(mode==='login') {
        const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;router.replace(next);router.refresh();
      } else if(mode==='forgot') {
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/callback?next=/reset-password`});if(error)throw error;setMessage('If an account can be verified for that address, a reset link will arrive shortly.');
      } else {
        if(password.length<8){setError('Use at least 8 characters for your new password.');return;}
        const {error}=await supabase.auth.updateUser({password});if(error)throw error;setMessage('Password updated. You can continue to your dashboard.');router.replace('/dashboard');router.refresh();
      }
    } catch (cause) { const code=typeof cause==='object'&&cause!==null&&'code' in cause?String((cause as {code:unknown}).code):''; if(mode==='signup')setError(code==='23505'?'That username is already in use. Try another one.':'We couldn’t create the account with those details. Check the information or sign in if you already have an account.'); else if(mode==='login')setError('We couldn’t sign you in with those details. Check your email and password and try again.'); else if(mode==='forgot')setMessage('If an account can be verified for that address, a reset link will arrive shortly.'); else setError('We couldn’t update the password. Request a fresh reset link and try again.'); }
    finally { setBusy(false); }
  }
  const title=mode==='login'?'Welcome back':mode==='signup'?'Create your account':mode==='forgot'?'Reset your password':'Choose a new password';
  return <form className="form-stack" onSubmit={submit}>
    {mode==='signup'&&<label>Display name<input name="displayName" autoComplete="name" maxLength={80} required placeholder="How you’d like to be known"/></label>}
    {mode==='signup'&&<label>Username<span className="field-hint">Your public portfolio address</span><div className="username-input"><span>umar.os/u/</span><input name="username" autoComplete="username" minLength={3} maxLength={30} pattern="[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]" required placeholder="your-name"/></div></label>}
    {mode!=='reset'&&<label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com"/></label>}
    {(mode==='signup'||mode==='login'||mode==='reset')&&<label>{mode==='reset'?'New password':'Password'}<input name="password" type="password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} required/></label>}
    {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
    <button className="button button-full" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':mode==='forgot'?'Send reset link':'Update password'} <span aria-hidden="true">→</span></button>
    {mode==='login'&&<Link className="form-foot-link" href="/forgot-password">Forgot password?</Link>}
    {(mode==='signup'||mode==='login')&&<p className="auth-switch">{mode==='signup'?'Already have an account?':'New to UMAR.OS?'} <Link href={mode==='signup'?'/login':'/signup'}>{mode==='signup'?'Sign in':'Create an account'}</Link></p>}
  </form>;
}
