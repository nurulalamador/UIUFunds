import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Image,
  Mic,
  Paperclip,
  Send,
  SlidersHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Flag,
} from "lucide-react";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { timeAgo } from "../utils/format";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const d = await api("/community/posts");
      const list = d.posts || [];
      setPosts(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const post = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      files.forEach((f) => fd.append("media", f));
      await api("/community/posts", { method: "POST", body: fd });
      setContent("");
      setFiles([]);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const react = async (id) => {
    try {
      await api(`/community/posts/${id}/react`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const report = async (id) => {
    try {
      await api(`/community/posts/${id}/report`, { method: "POST" });
      setError("Post reported to the admin team.");
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <LoadingBlock text="Loading community feed..." />;

  return (
    <div className="content-container">
      <Alert>{error}</Alert>
      <form className="composer" onSubmit={post}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Create a loan request or crowdfunding campaign..."
        />
        <div className="composer-actions">
          <div className="composer-actions-buttons">
            <label className="icon-button square">
              <Image size={18} />
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={(e) =>
                  setFiles(Array.from(e.target.files).slice(0, 4))
                }
              />
            </label>
            <button className="icon-button square" type="button" disabled>
              <Mic size={18} />
            </button>
            <label className="icon-button square">
              <Paperclip size={18} />
              <input
                type="file"
                multiple
                hidden
                onChange={(e) =>
                  setFiles(Array.from(e.target.files).slice(0, 4))
                }
              />
            </label>
            {files.length > 0 && (
              <span className="file-count">
                {files.length} file(s) selected
              </span>
            )}
          </div>
          <button className="button primary" disabled={busy || !content.trim()}>
            <Send size={15} />
            {busy ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      <div className="section-row community-heading">
        <h2>Community Posts</h2>
        <div className="filter-row">
          <div className="filter-row-title">
            <SlidersHorizontal size={17} />
            <span>Filter</span>
          </div>
          <select>
            <option>Recently Popular</option>
            <option>Newest First</option>
          </select>
        </div>
      </div>

      {posts.length ? (
        <div className="feed-list">
          {posts.map((p) => {
            const media = p?.media || [];
            return (
              <article
                className="post-card"
                key={p.id}
                onClick={() => navigate(`/app/community/posts/${p.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/app/community/posts/${p.id}`);
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <div className="post-head">
                  <img src="/assets/avatar.jpg" alt="" />
                  <div className="post-card-user-details">
                    <div className="post-card-user-name">
                      {p?.poster_name || "UIU User"}
                    </div>
                    <div
                      className={`post-card-user-status${p?.poster_verified ? " verified" : ""}`}
                    >
                      {p?.poster_verified ? "UIU Verified" : `Not verified`}
                    </div>
                  </div>
                  <button className="icon-button plain" title="Report post" onClick={(e) => { e.stopPropagation(); report(p.id); }}><Flag size={16} /></button>
                </div>
                <div className="post-content">{p.content}</div>
                {media.length > 0 && (
                  <div
                    className={`post-media-grid count-${Math.min(media.length, 2)}`}
                  >
                    {media.slice(0, 4).map((m, i) =>
                      m.media_type === "image" ? (
                        <img
                          key={m.id}
                          src={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}${m.media_url}`}
                          alt={m.file_name || `post media ${i + 1}`}
                        />
                      ) : (
                        <a
                          key={m.id}
                          href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}${m.media_url}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {m.file_name || "Open attachment"}
                        </a>
                      ),
                    )}
                  </div>
                )}
                <div className="post-stats">
                  <span>
                    {p.react_count || 0} reacts • {p.comment_count || 0}{" "}
                    comments
                  </span>
                  <span>{timeAgo(p.created_at)}</span>
                </div>
                <div className="post-actions">
                  <button
                    className={`${p.is_reacted ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); react(p.id); }}
                  >
                    <ThumbsUp size={16} />
                    {p.is_reacted ? "Liked" : "Like"}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/app/community/posts/${p.id}`); }}>
                    <MessageCircle size={16} /> Comment
                  </button>
                  <button type="button" onClick={(e) => e.stopPropagation()}>
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No community posts yet"
          text="Be the first person to share something with the community."
        />
      )}
    </div>
  );
}
