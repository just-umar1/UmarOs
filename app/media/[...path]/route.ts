import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/config';

export const dynamic = 'force-dynamic';
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!isSupabaseConfigured) return new NextResponse(null, { status: 503 });
  const { path: segments } = await params;
  const path = segments.join('/');
  if (!/^[0-9a-f-]{36}\/(?:avatar|[0-9a-f-]{36})\/[a-zA-Z0-9-]+\.(?:jpg|png|webp)$/i.test(path)) {
    return new NextResponse(null, { status: 404 });
  }
  const supabase = await createClient();
  if (!supabase) return new NextResponse(null, { status: 503 });
  const { data, error } = await supabase.storage.from('portfolio-assets').download(path);
  if (error || !data || !allowedTypes.has(data.type)) return new NextResponse(null, { status: 404 });
  return new NextResponse(data, { headers: {
    'Content-Type': data.type,
    'Content-Disposition': 'inline; filename="portfolio-image"',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  } });
}
