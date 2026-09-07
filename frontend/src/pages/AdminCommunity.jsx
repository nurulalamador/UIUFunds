import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { shortDate } from "../utils/format";

export default function AdminCommunity() {
  const [tab, setTab] = useState("reported");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setPosts((await api(`/admin/community/posts?tab=${tab}`)).posts || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const remove = async (id) => {
    setBusy(id);
    setError("");
    try {
      await api(`/admin/community/posts/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingBlock text="Loading community posts..." />;
  return (
    <div className="content-container admin-page">
      <div className="admin-tabs">
        <button
          className={tab === "reported" ? "active" : ""}
          onClick={() => setTab("reported")}
        >
          Reported posts
        </button>
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          All posts
        </button>
      </div>
      <Alert>{error}</Alert>
      {posts.length ? (
        <div className="moderation-list">
          {posts.map((post) => (
            <article className="moderation-item" key={post.id}>
              <div>
                <div className="moderation-meta">
                  <strong>{post.poster_name}</strong>
                  <span>@{post.poster_username}</span>
                  <span>{shortDate(post.created_at)}</span>
                </div>
                <p>{post.content}</p>
                {Number(post.report_count) > 0 && (
                  <span className="badge red">
                    {post.report_count} report(s)
                  </span>
                )}
              </div>
              <button
                className="button danger-soft"
                disabled={busy === post.id}
                onClick={() => remove(post.id)}
              >
                <Trash2 size={15} /> Delete
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            tab === "reported" ? "No reported posts" : "No community posts"
          }
          text={
            tab === "reported"
              ? "The community has no pending reports."
              : "There are no posts to review yet."
          }
        />
      )}
    </div>
  );
}
