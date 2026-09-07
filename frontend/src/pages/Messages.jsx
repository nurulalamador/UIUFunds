import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { timeAgo } from "../utils/format";


export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = Number(searchParams.get("user")) || null;
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = async () => {
    const data = await api("/messages");
    setConversations(data.conversations || []);
  };

  useEffect(() => {
    loadConversations()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedUser(null);
      setMessages([]);
      return;
    }
    setThreadLoading(true);
    setError("");
    api(`/messages/${selectedId}`)
      .then((data) => {
        setSelectedUser(data.user);
        setMessages(data.messages || []);
        setConversations((items) =>
          items.map((item) =>
            item.id === selectedId ? { ...item, unread_count: 0 } : item,
          ),
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setThreadLoading(false));
  }, [selectedId]);

  const send = async (event) => {
    event.preventDefault();
    if (!selectedUser || !content.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api("/messages", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: content.trim(),
        }),
      });
      setContent("");
      const data = await api(`/messages/${selectedUser.id}`);
      setMessages(data.messages || []);
      await loadConversations();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock text="Loading messages..." />;

  return (
    <>
      <Alert>{error}</Alert>
      <div className="messages-layout">
        <aside className="conversation-list">
          <div className="messages-panel-title">
            <MessageSquare size={24}/>
            <span>Inbox</span>
          </div>
          {conversations.length ? (
            conversations.map((item) => (
              <button
                className={`conversation-row${item.id === selectedId ? " active" : ""}`}
                key={item.id}
                onClick={() => setSearchParams({ user: String(item.id) })}
              >
                <img src="/assets/avatar.jpg" className="message-user-avatar"/>
                <span className="conversation-row-content">
                  <span className="conversation-row-head">
                    <div className="convesation-user-name">{item.name}</div>
                    <div className="convesation-time">{timeAgo(item.last_message_at)}</div>
                  </span>
                  <span className="conversation-preview">
                    {item.last_message}
                  </span>
                </span>
                {Number(item.unread_count) > 0 && (
                  <span className="message-unread-count">
                    {item.unread_count}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="messages-empty-small">No conversations yet.</div>
          )}
        </aside>
        <section className="message-thread">
          {!selectedId ? (
            <EmptyState
              title="Select a conversation"
              text="Choose someone from your inbox to view the conversation."
            />
          ) : threadLoading ? (
            <LoadingBlock text="Loading conversation..." />
          ) : selectedUser ? (
            <>
              <header className="message-thread-head">
                <img className="message-user-avatar" src="/assets/avatar.jpg"/>
                <div>
                  <div className="message-user-name">{selectedUser.name}</div>
                  <div className="message-user-username">@{selectedUser.username}</div>
                </div>
              </header>
              <div className="message-thread-body">
                {messages.length ? (
                  messages.map((item) => (
                    <div
                      className={`message-bubble-row${item.sender_id === selectedUser.id ? " received" : " sent"}`}
                      key={item.id}
                    >
                      <div className="message-bubble">
                        <div>{item.content}</div>
                        <small>{timeAgo(item.sent_at)}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="messages-empty-thread">
                    Start the conversation.
                  </div>
                )}
              </div>
              <form className="message-compose" onSubmit={send}>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={`Write to ${selectedUser.name}...`}
                  maxLength={5000}
                  rows={2}
                />
                <button
                  className="button primary"
                  disabled={busy || !content.trim()}
                >
                  <Send size={15} /> {busy ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
