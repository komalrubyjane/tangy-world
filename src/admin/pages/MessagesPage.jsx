import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Page } from '../ui';
import { MessagesPanel } from '../../portal/MessagesPanel';

// Partner inbox: artist / sponsor / vendor / venue host threads with Tangy.
// Each conversation has its own URL (/admin-portal/messages/:conversationId).
// Website support threads keep their own inbox under More operations.
export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  if (params.get('c')) return <Navigate to={`/admin-portal/messages/${params.get('c')}`} replace />;
  const select = (id) => navigate(id ? `/admin-portal/messages/${id}${params.get('event') ? `?event=${params.get('event')}` : ''}` : '/admin-portal/messages');
  return (
    <Page title="Messages" subtitle="Conversations with artists, sponsors, vendors and venue hosts. Partners can only reach Tangy — never each other. Messages are not end-to-end encrypted: the Tangy team can read them."
      crumbs={conversationId ? [{ label: 'Conversation' }] : undefined}>
      <MessagesPanel mode="admin" selectedId={conversationId || null} onSelect={select} eventFilter={params.get('event')} />
    </Page>
  );
}
