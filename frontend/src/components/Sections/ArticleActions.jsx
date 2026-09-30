import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getLikes, toggleLike, getComments, postComment, uploadCommentImage, resolveUploadUrl } from '../../services/articlesApi';
import './ArticleActions.css';

// ── User token (persisted in localStorage) ────────────────────────────────────
function getUserToken() {
  let t = localStorage.getItem('alchmi_user_token');
  if (!t) {
    t = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('alchmi_user_token', t);
  }
  return t;
}

// ── Share platforms ───────────────────────────────────────────────────────────
function buildShareUrl(platform, url, title) {
  const enc = encodeURIComponent;
  switch (platform) {
    case 'twitter':   return `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`;
    case 'linkedin':  return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`;
    case 'facebook':  return `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
    case 'whatsapp':  return `https://wa.me/?text=${enc(title + ' ' + url)}`;
    default:          return '#';
  }
}

// ── Comment Modal ─────────────────────────────────────────────────────────────
function CommentModal({ articleId, articleTitle, onClose }) {
  const [comments,     setComments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [authorName,   setAuthorName]   = useState('');
  const [text,         setText]         = useState('');
  const [imgFile,      setImgFile]      = useState(null);
  const [imgPreview,   setImgPreview]   = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const fileRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    getComments(articleId)
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape + lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imgFile) {
      setSubmitError('Please write a comment or attach an image.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      let image_url = '';
      if (imgFile) {
        const up = await uploadCommentImage(articleId, imgFile);
        image_url = up.image_url || '';
      }
      await postComment(articleId, {
        author_name: authorName.trim() || 'Anonymous',
        content: text.trim(),
        image_url,
      });
      setSubmitted(true);
      setAuthorName('');
      setText('');
      setImgFile(null);
      setImgPreview('');
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return createPortal(
    <div className="ac-overlay">
      <div className="ac-modal">
        {/* Header */}
        <div className="ac-modal-header">
          <div>
            <div className="ac-modal-eyebrow">Comments</div>
            <h2 className="ac-modal-title">{articleTitle}</h2>
          </div>
          <button className="ac-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Comment list */}
        <div className="ac-comments-area">
          {loading && <div className="ac-empty">Loading comments…</div>}
          {!loading && comments.length === 0 && (
            <div className="ac-empty">No comments yet — be the first to share your thoughts.</div>
          )}
          {!loading && comments.map((c, i) => (
            <div key={c.id || i} className="ac-comment">
              <div className="ac-comment-meta">
                <span className="ac-comment-author">{c.author_name || 'Anonymous'}</span>
                <span className="ac-comment-date">{formatDate(c.created_at)}</span>
              </div>
              {c.content && <p className="ac-comment-text">{c.content}</p>}
              {c.image_url && (
                <div className="ac-comment-img-wrap">
                  <img
                    src={resolveUploadUrl(c.image_url)}
                    alt={`Comment by ${c.author_name}`}
                    className="ac-comment-img"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit form */}
        <div className="ac-form-area">
          {submitted ? (
            <div className="ac-submitted">
              <span className="ac-submitted-icon">✓</span>
              Your comment has been submitted and will appear once approved. Thank you!
            </div>
          ) : (
            <form className="ac-form" onSubmit={handleSubmit}>
              <div className="ac-form-label">Leave a Comment</div>
              <input
                className="ac-form-input"
                type="text"
                placeholder="Your name (optional)"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                maxLength={100}
              />
              <textarea
                className="ac-form-textarea"
                placeholder="Share your thoughts…"
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                maxLength={2000}
              />
              <div className="ac-form-img-row">
                <button type="button" className="ac-img-attach-btn" onClick={() => fileRef.current?.click()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {imgFile ? 'Change image' : 'Attach image'}
                </button>
                {imgPreview && (
                  <div className="ac-img-preview-wrap">
                    <img src={imgPreview} alt="Preview" className="ac-img-preview" />
                    <button type="button" className="ac-img-remove" onClick={() => { setImgFile(null); setImgPreview(''); }}>✕</button>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
              {submitError && <div className="ac-form-error">{submitError}</div>}
              <button className="ac-form-submit" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Comment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Share Dropdown ────────────────────────────────────────────────────────────
function ShareDropdown({ articleUrl, articleTitle, onClose }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const openShare = (platform) => {
    window.open(buildShareUrl(platform, articleUrl, articleTitle), '_blank', 'noopener,noreferrer,width=600,height=480');
    onClose();
  };

  return (
    <div className="ac-share-dropdown" ref={ref}>
      <button className="ac-share-item" onClick={copyLink}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button className="ac-share-item" onClick={() => openShare('twitter')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on X
      </button>
      <button className="ac-share-item" onClick={() => openShare('linkedin')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
        Share on LinkedIn
      </button>
      <button className="ac-share-item" onClick={() => openShare('facebook')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
        Share on Facebook
      </button>
      <button className="ac-share-item" onClick={() => openShare('whatsapp')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
        Share on WhatsApp
      </button>
    </div>
  );
}

// ── Main ArticleActions component ─────────────────────────────────────────────
function ArticleActions({ articleId, articleSlug, articleTitle, compact = false }) {
  const articleUrl = `${window.location.origin}/articles/${articleSlug}`;

  const [likeCount,      setLikeCount]      = useState(0);
  const [liked,          setLiked]          = useState(false);
  const [likeLoading,    setLikeLoading]    = useState(false);
  const [commentCount,   setCommentCount]   = useState(null);
  const [showComments,   setShowComments]   = useState(false);
  const [showShare,      setShowShare]      = useState(false);
  const shareRef = useRef(null);

  // Stable token — computed once, never changes across renders
  const userTokenRef = useRef(null);
  if (userTokenRef.current === null) userTokenRef.current = getUserToken();
  const userToken = userTokenRef.current;

  // Load initial likes + comment count
  useEffect(() => {
    getLikes(articleId, userToken)
      .then(d => { setLikeCount(d.count || 0); setLiked(!!d.liked); })
      .catch(() => {});

    getComments(articleId)
      .then(d => setCommentCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [articleId]); // userToken is stable via ref — no need in deps

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      // Use server response directly — avoids stale-closure count mismatches
      // and ensures virtual_likes are included in the displayed total
      const res = await toggleLike(articleId, userToken);
      setLikeCount(res.count);
      setLiked(res.liked);
    } catch {
      // silent fail — count unchanged
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentsOpen = () => setShowComments(true);
  const handleCommentsClose = () => {
    setShowComments(false);
    // Refresh count after closing modal (user may have submitted)
    getComments(articleId)
      .then(d => setCommentCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  };

  return (
    <>
      <div className={`ac-actions${compact ? ' ac-actions--compact' : ''}`}>
        {/* Like */}
        <button
          className={`ac-btn ac-btn--like${liked ? ' ac-btn--liked' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
          aria-label={liked ? 'Unlike this article' : 'Like this article'}
          title={liked ? 'Unlike' : 'Like'}
        >
          <svg className="ac-icon" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="ac-btn-label">
            {compact ? (likeCount > 0 ? likeCount : 'Like') : `Like${likeCount > 0 ? ` (${likeCount})` : ''}`}
          </span>
        </button>

        {/* Comment */}
        <button
          className="ac-btn ac-btn--comment"
          onClick={handleCommentsOpen}
          aria-label="View and add comments"
          title="Comments"
        >
          <svg className="ac-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="ac-btn-label">
            {compact
              ? (commentCount !== null && commentCount > 0 ? commentCount : 'Comment')
              : `Comment${commentCount !== null && commentCount > 0 ? ` (${commentCount})` : ''}`}
          </span>
        </button>

        {/* Share */}
        <div className="ac-share-wrap" ref={shareRef}>
          <button
            className={`ac-btn ac-btn--share${showShare ? ' ac-btn--active' : ''}`}
            onClick={() => setShowShare(v => !v)}
            aria-label="Share this article"
            title="Share"
          >
            <svg className="ac-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className="ac-btn-label">Share</span>
          </button>
          {showShare && (
            <ShareDropdown
              articleUrl={articleUrl}
              articleTitle={articleTitle}
              onClose={() => setShowShare(false)}
            />
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showComments && (
        <CommentModal
          articleId={articleId}
          articleTitle={articleTitle}
          onClose={handleCommentsClose}
        />
      )}
    </>
  );
}

export default ArticleActions;
