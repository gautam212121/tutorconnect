"use client";

import { useEffect, useMemo, useState } from 'react';
import { Send, MessageSquareText, UserRound, ArrowLeft } from 'lucide-react';
import { useSocket } from '../../../../hooks/useSocket';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

export default function TutorMessagesPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('verifiedtutor-user') || 'null');
    const token = localStorage.getItem('verifiedtutor-token');
    if (!storedUser || !token) {
      setLoading(false);
      return;
    }
    setUser(storedUser);

    fetch(`${API}/api/v1/messages/inbox/${storedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
        if (data?.[0]?.partner) setSelectedPartner(data[0].partner);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !selectedPartner) return;

    const token = localStorage.getItem('verifiedtutor-token');
    fetch(`${API}/api/v1/messages/conversation/${user.id}/${selectedPartner.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]));
  }, [selectedPartner, user]);

  useEffect(() => {
    if (!socket || !user) return;
    const onNewMessage = (msg) => {
      const incomingFrom = String(msg?.from?.id ?? msg?.from ?? '');
      const incomingTo = String(msg?.to?.id ?? msg?.to ?? '');
      const currentUser = String(user.id);

      if (!selectedPartner) return;
      if ((incomingFrom === String(selectedPartner.id) || incomingTo === String(selectedPartner.id)) &&
        (incomingFrom === currentUser || incomingTo === currentUser)) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m?._id ?? m?.id) === String(msg?._id ?? msg?.id));
          if (exists) return prev;
          return [...prev, msg];
        });
      }

      setConversations((prev) => prev.map((c) => {
        if (String(c.partner?.id ?? c.partner?._id) !== String(incomingFrom) && String(c.partner?.id ?? c.partner?._id) !== String(incomingTo)) return c;
        return { ...c, lastMessage: msg };
      }));
    };

    socket.on('newMessage', onNewMessage);
    return () => socket.off('newMessage', onNewMessage);
  }, [socket, user, selectedPartner]);

  const activeConversation = useMemo(() =>
    conversations.find((c) => String(c.partner?.id ?? c.partner?._id) === String(selectedPartner?.id ?? selectedPartner?._id))
    || null,
  [conversations, selectedPartner]);

  const handleSend = async () => {
    if (!draft.trim() || !user || !selectedPartner) return;

    const payload = {
      from: user.id,
      to: selectedPartner.id,
      type: 'text',
      content: draft.trim(),
    };

    const token = localStorage.getItem('verifiedtutor-token');
    const response = await fetch(`${API}/api/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const msg = await response.json();
      setMessages((prev) => [...prev, msg]);
      setDraft('');
      setConversations((prev) => {
        const next = prev.map((c) =>
          String(c.partner?.id ?? c.partner?._id) === String(selectedPartner.id)
            ? { ...c, lastMessage: msg }
            : c
        );
        if (!next.some((c) => String(c.partner?.id ?? c.partner?._id) === String(selectedPartner.id))) {
          next.unshift({ partner: selectedPartner, lastMessage: msg, unread: 0 });
        }
        return next;
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Messages</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Inbox</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
            <MessageSquareText size={12} /> Real-time chat
          </div>
        </div>

        <div className="grid min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
            <div className="space-y-2 p-3">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-400">Loading conversations…</div>
              ) : conversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-400">No conversations yet.</div>
              ) : (
                conversations.map((conversation) => {
                  const partner = conversation.partner;
                  const id = String(partner?.id ?? partner?._id ?? '');
                  const isActive = String(selectedPartner?.id ?? selectedPartner?._id ?? '') === id;
                  const last = conversation.lastMessage?.content || 'No messages yet';

                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedPartner(partner)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${isActive ? 'border-emerald-200 bg-emerald-50' : 'border-transparent bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-[11px] font-bold text-slate-700">
                            {(partner?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{partner?.name || 'Unknown User'}</p>
                            <p className="text-[10px] text-slate-500">{partner?.role || 'User'}</p>
                          </div>
                        </div>
                        {conversation.unread > 0 && (
                          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{conversation.unread}</span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">{last}</p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[600px] flex-col">
            {selectedPartner ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <button
                    onClick={() => setSelectedPartner(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 lg:hidden"
                    aria-label="Back"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedPartner.name}</p>
                    <p className="text-[10px] text-slate-500">{selectedPartner.role || 'User'}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">No messages yet.</div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine = String(msg.from?.id ?? msg.from) === String(user.id);
                      return (
                        <div key={`${msg.id || msg._id || idx}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                            <p>{msg.content}</p>
                            <p className={`mt-1 text-[9px] ${isMine ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-3">
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      onClick={handleSend}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Select a conversation to start chatting.</div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
