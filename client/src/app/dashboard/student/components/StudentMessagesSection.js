import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentMessagesSection({ user }) {
  const [tutors, setTutors] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTutorsAndInbox();

    const token = localStorage.getItem('verifiedtutor-token');
    const newSocket = io(API, { auth: { token } });
    setSocket(newSocket);

    newSocket.on('newMessage', (msg) => {
      // Check if message is for the active conversation
      if (
        (String(msg.from?.id || msg.from) === String(activePartner?.id) && String(msg.to?.id || msg.to) === String(user?.id)) ||
        (String(msg.from?.id || msg.from) === String(user?.id) && String(msg.to?.id || msg.to) === String(activePartner?.id))
      ) {
        setMessages((prev) => [...prev, msg]);
        markAsRead(activePartner?.id);
      }
      // Reload inbox list to show latest message preview
      fetchTutorsAndInbox(false);
    });

    return () => newSocket.disconnect();
  }, [activePartner]);

  useEffect(() => {
    if (activePartner) {
      fetchConversation(activePartner.id);
    }
  }, [activePartner]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTutorsAndInbox = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      
      // Fetch inbox conversations
      const resInbox = await fetch(`${API}/api/v1/messages/inbox/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let inboxList = [];
      if (resInbox.ok) {
        inboxList = await resInbox.json();
      }

      // Fetch assigned tutors from bookings
      const resDashboard = await fetch(`${API}/api/v1/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let assignedTutors = [];
      if (resDashboard.ok) {
        const dashboard = await resDashboard.json();
        assignedTutors = dashboard.assignedTutors || [];
      }

      // Merge inbox and assigned tutors to ensure all assigned tutors are contactable
      const mergedTutors = [];
      const addedIds = new Set();

      // Add inbox partners
      inboxList.forEach((c) => {
        if (c.partner && c.partner.id !== user.id) {
          mergedTutors.push({
            id: c.partner.id,
            name: c.partner.name,
            email: c.partner.email,
            avatar: c.partner.avatar,
            lastMessage: c.lastMessage?.content || '',
            unread: c.unread || 0,
            updatedAt: c.lastMessage?.createdAt
          });
          addedIds.add(String(c.partner.id));
        }
      });

      // Add assigned tutors not in inbox yet
      assignedTutors.forEach((at) => {
        if (!addedIds.has(String(at.tutorId))) {
          mergedTutors.push({
            id: Number(at.tutorId),
            name: at.tutorName,
            email: '',
            avatar: null,
            lastMessage: 'Tap to start conversation',
            unread: 0,
            updatedAt: null
          });
          addedIds.add(String(at.tutorId));
        }
      });

      setTutors(mergedTutors);
      if (showLoading) setLoading(false);
    } catch (err) {
      console.error('Error fetching inbox:', err);
      if (showLoading) setLoading(false);
    }
  };

  const fetchConversation = async (partnerId) => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/messages/conversation/${user.id}/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        markAsRead(partnerId);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  };

  const markAsRead = async (partnerId) => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      await fetch(`${API}/api/v1/messages/read/${user.id}/${partnerId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Clear unread count locally
      setTutors((prev) =>
        prev.map((t) => (t.id === partnerId ? { ...t, unread: 0 } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner) return;

    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          from: user.id,
          to: activePartner.id,
          content: newMessage
        })
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
        fetchTutorsAndInbox(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Loading chat interface...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[calc(100vh-140px)] flex flex-col md:flex-row">
      
      {/* Tutors/Inbox Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${activePartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <p className="text-sm font-extrabold text-slate-800">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {tutors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
              No active tutors assigned yet.
            </div>
          ) : (
            tutors.map((t) => (
              <button
                key={t.id}
                onClick={() => setActivePartner(t)}
                className={`w-full text-left p-4 flex gap-3 items-center hover:bg-slate-50 transition ${
                  activePartner?.id === t.id ? 'bg-emerald-50/40 border-l-4 border-emerald-600' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-xs font-bold text-slate-800 truncate">{t.name}</p>
                    {t.unread > 0 && (
                      <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{t.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Pane */}
      <div className={`flex-1 flex flex-col bg-slate-50/30 ${!activePartner ? 'hidden md:flex justify-center items-center text-slate-400 p-8' : 'flex'}`}>
        {activePartner ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
              <button onClick={() => setActivePartner(null)} className="md:hidden text-slate-500 hover:text-slate-700">
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                {activePartner.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{activePartner.name}</p>
                <p className="text-[9px] text-slate-400">Tutor</p>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, idx) => {
                const isSender = String(m.from?.id || m.from) === String(user.id);
                return (
                  <div key={idx} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-xs shadow-xs font-medium ${
                      isSender ? 'bg-[#056852] text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-[8px] mt-1 text-right ${isSender ? 'text-emerald-100/70' : 'text-slate-400'}`}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <button type="submit" className="bg-[#056852] text-white p-2.5 rounded-xl hover:bg-[#045242] transition shrink-0">
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Your Conversations</p>
            <p className="text-xs text-slate-500 mt-1">Select a tutor to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
}
