import { supabase, isSupabaseConfigured } from './supabaseClient';

// One way to handle files across portals and the admin portal.
//
// Private buckets (artist-media, event-documents, sponsor-assets) are never
// exposed through public URLs: files are uploaded under paths the storage RLS
// policies check, and read back only through short-lived signed URLs — and
// Storage only signs a URL when the caller passes the same SELECT policy.
// The only public bucket is artist-avatars (profile photos on the public site).

export const PRIVATE_BUCKETS = ['artist-media', 'event-documents', 'sponsor-assets'];
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const safeFileName = (name) =>
  String(name || 'file').normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-120);

export const formatBytes = (n) => {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

// Uploads with real progress events (Storage REST + the user's own JWT, so
// the bucket's RLS policies decide). Resolves { path } or rejects with a
// user-safe message.
export function uploadWithProgress(bucket, path, file, { onProgress, upsert = false, maxBytes = MAX_UPLOAD_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    if (!isSupabaseConfigured) { reject(new Error('Storage is not connected.')); return; }
    if (file.size > maxBytes) { reject(new Error(`Files must be under ${formatBytes(maxBytes)}.`)); return; }
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) { reject(new Error('Please sign in again.')); return; }
      const base = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${base}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
      xhr.setRequestHeader('x-upsert', upsert ? 'true' : 'false');
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((100 * e.loaded) / e.total)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(100); resolve({ path }); return; }
        let msg = 'Upload failed.';
        try {
          const body = JSON.parse(xhr.responseText);
          if (/row-level security|unauthorized|403/i.test(`${body.message} ${body.statusCode}`)) msg = "You don't have permission to upload here.";
          else if (/exists|duplicate/i.test(body.message || '')) msg = 'A file with that name already exists.';
          else if (/size|too large|413/i.test(`${body.message} ${xhr.status}`)) msg = 'That file is too large.';
        } catch { /* keep generic */ }
        reject(new Error(msg));
      };
      xhr.onerror = () => reject(new Error('Network error — check your connection and try again.'));
      xhr.send(file);
    });
  });
}

// Short-lived signed URL for a private object (default 10 minutes).
export async function signedUrl(bucket, path, seconds = 600) {
  if (!isSupabaseConfigured) throw new Error('Storage is not connected.');
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error || !data?.signedUrl) throw new Error("This file isn't available to you.");
  return data.signedUrl;
}

// Opens a private file in a new tab. The tab is opened synchronously (so
// popup blockers allow it) and pointed at the signed URL once it's ready.
export async function openPrivateFile(bucket, path) {
  const tab = window.open('', '_blank');
  try {
    const url = await signedUrl(bucket, path);
    if (tab) { tab.opener = null; tab.location.href = url; } else window.location.assign(url);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

export async function removeFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error("Couldn't remove the file.");
}
