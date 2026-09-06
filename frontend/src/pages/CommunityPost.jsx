import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Send, Share2, ThumbsUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { timeAgo } from "../utils/format";
import TopbarAlt from "../components/TopbarAlt";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function parseMedia(media) {
  if (Array.isArray(media)) return media;
  if (!media) return [];
  try {
    return JSON.parse(media);
  } catch {
    return [];
  }
}

export default function CommunityPost() {
  const { postId } = useParams();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setData(await api(`/community/posts/${postId}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const react = async () => {
    try {
      await api(`/community/posts/${postId}/react`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: comment.trim() }),
      });
      setComment("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock text="Loading post..." />;
  if (!data?.post)
    return (
      <EmptyState
        title="Post not found"
        text="This community post is no longer available."
      />
    );

  const { post } = data;
  const media = parseMedia(post.media);
  const comments = data.comments || [];

  return (
    <>
      <TopbarAlt title="Post"/>
      <div className="content-container">
        <Alert>{error}</Alert>
        <article className="post-card">
          <div className="post-head">
            <img
              src={
                post?.poster_profile_picture_url
                  ? poster_profile_picture_url
                  : "/assets/avatar.jpg"
              }
              alt=""
            />
            <div className="post-card-user-details">
              <div className="post-card-user-name">
                {post.poster_name || "UIU User"}
              </div>
              <div
                className={`post-card-user-status${post.poster_verified ? " verified" : ""}`}
              >
                {post.poster_verified ? "UIU Verified" : "Not verified"}
              </div>
            </div>
          </div>
          <div className="post-content">{post.content}</div>
          {media.length > 0 && (
            <div
              className={`post-media-grid count-${Math.min(media.length, 2)}`}
            >
              {media.slice(0, 4).map((item, index) =>
                item.media_type === "image" ? (
                  <img
                    key={item.id}
                    src={`${apiBase}${item.media_url}`}
                    alt={item.file_name || `post media ${index + 1}`}
                  />
                ) : (
                  <a
                    key={item.id}
                    href={`${apiBase}${item.media_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.file_name || "Open attachment"}
                  </a>
                ),
              )}
            </div>
          )}
          <div className="post-stats">
            <span>
              {post.react_count || 0} reacts • {post.comment_count || 0}{" "}
              comments
            </span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
          <div className="post-actions">
            <button className={post.is_reacted ? "active" : ""} onClick={react}>
              <ThumbsUp size={16} /> {post.is_reacted ? "Liked" : "Like"}
            </button>
            <button type="button">
              <MessageCircle size={16} /> Comment
            </button>
            <button type="button">
              <Share2 size={16} /> Share
            </button>
          </div>
        </article>

        <div className="comments-section">
          <div className="section-row">
            <h3>Comments ({comments.length})</h3>
          </div>
          <form className="comment-box comment-form" onSubmit={addComment}>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
            />
            <button disabled={busy || !comment.trim()}>
              <Send size={15} />
            </button>
          </form>
          {comments.length > 0 ? (
            <div className="comment-list">
              {comments.map((item) => (
                <article className="comment-item" key={item.id}>
                  <img
                    className="comment-item-pic"
                    src={
                      item?.commenter_profile_picture_url
                        ? commenter_profile_picture_url
                        : "/assets/avatar.jpg"
                    }
                    alt=""
                  />
                  <div className="comment-content">
                    <div className="comment-content-name">{item.commenter_name || "UIU User"}</div>
                    <div className="comment-content-message">{item.content}</div>
                    <div className="comment-content-time">{timeAgo(item.created_at)}</div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No comments yet"
              text="Be the first to comment on this post."
            />
          )}
        </div>
      </div>
    </>
  );
}
