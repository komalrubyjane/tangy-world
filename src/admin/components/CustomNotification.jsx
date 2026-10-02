import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { Panel, Field, Input, Textarea, Button, useToast } from '../ui';

// Super Admin → this one person (send_custom_notification enforces the role).
export const CustomNotificationForm = ({ userId, name }) => {
  const toast = useToast();
  const [f, setF] = useState({ title: '', body: '', link: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const send = async () => {
    setBusy(true); setResult(null);
    const { data, error } = await supabase.rpc('send_custom_notification', { p_user_id: userId, p_title: f.title, p_body: f.body, p_link: f.link || null });
    setBusy(false);
    if (error) { toast(friendlyError(error).message, 'bad'); return; }
    setResult(data);
    setF({ title: '', body: '', link: '' });
    toast('Notification sent');
  };
  return (
    <Panel title="Send a notification" subtitle={`Appears in ${name}'s notification centre.`}>
      <div className="flex flex-col gap-3" data-custom-notification>
        <Field label="Recipient"><Input value={name} readOnly disabled /></Field>
        <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} placeholder="Important update" /></Field>
        <Field label="Message"><Textarea rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={1000} /></Field>
        <Field label="Link (optional)" hint="A Tangy page, e.g. /artist/calendar"><Input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="/artist/calendar" /></Field>
        <Button variant="primary" icon="Send" disabled={busy || !f.title.trim() || !f.body.trim()} onClick={send} className="self-start">{busy ? 'Sending…' : 'Send'}</Button>
        {result && (
          <p role="status" className="text-[12.5px] text-[#E7D5A4]/80 m-0" data-custom-notification-result>
            Delivered in-app. {result.email_queued ? 'An email was queued; it is sent only if email delivery is configured.' : 'No email was queued (their settings or this notification type).'}
          </p>
        )}
      </div>
    </Panel>
  );
};

