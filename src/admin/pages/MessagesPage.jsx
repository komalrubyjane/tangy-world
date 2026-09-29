import { useSearchParams } from 'react-router-dom';
import { Page } from '../ui';
import { MessagesPanel } from '../../portal/MessagesPanel';

// Partner inbox: artist / sponsor / vendor / venue host threads with Tangy.
// Website support threads keep their own inbox under More operations.
export default function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const select = (id) => setParams((p) => {
    const n = new URLSearchParams(p);
    if (id) n.set('c', id); else n.delete('c');
    return n;
  }, { replace: true });
  return (
    <Page title="Messages" subtitle="Conversations with artists, sponsors, vendors and venue hosts. Partners can only reach Tangy — never each other.">
      <MessagesPanel mode="admin" selectedId={params.get('c')} onSelect={select} eventFilter={params.get('event')} />
    </Page>
  );
}
