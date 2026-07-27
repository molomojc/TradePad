import React, { useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';

const defaultForm = {
  title: '',
  slug: '',
  summary: '',
  body: '',
  category: 'platform',
  featured: false,
  publishNow: true,
};

const categoryOptions = ['platform', 'launch', 'premium', 'market'];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildPreview(form) {
  return {
    title: form.title || 'Post title preview',
    summary: form.summary || 'Short summary preview will appear here.',
    body: form.body || 'Your long-form article body will appear here.',
    category: form.category,
    featured: form.featured,
  };
}

export default function ManageNews() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const preview = useMemo(() => buildPreview(form), [form]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('news_posts')
        .select('id, title, slug, summary, body, category, featured, published_at, created_at, updated_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (active) setPosts(data ?? []);
      if (active) setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !current.slug) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const savePost = async () => {
    if (!supabase) return;

    try {
      setSaving(true);
      setMessage('');

      const slug = slugify(form.slug || form.title);
      if (!form.title || !slug || !form.body) {
        throw new Error('Title, slug, and body are required.');
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      const publishedAt = form.publishNow ? new Date().toISOString() : null;

      const payload = {
        title: form.title.trim(),
        slug,
        summary: form.summary.trim() || null,
        body: form.body.trim(),
        category: form.category,
        featured: Boolean(form.featured),
        published_at: publishedAt,
        created_by: userId,
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('news_posts')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .select('id, title, slug, summary, body, category, featured, published_at, created_at, updated_at')
          .single();
      } else {
        result = await supabase
          .from('news_posts')
          .insert(payload)
          .select('id, title, slug, summary, body, category, featured, published_at, created_at, updated_at')
          .single();
      }

      const { data, error } = result;
      if (error) throw error;

      setPosts((current) => {
        if (editingId) {
          return current.map((post) => (post.id === editingId ? data : post));
        }
        return [data, ...current];
      });

      setMessage(editingId ? 'News post updated successfully.' : form.publishNow ? 'News published successfully.' : 'News saved as a draft.');
      resetForm();
    } catch (error) {
      setMessage(error?.message || 'Unable to save news post.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      summary: post.summary || '',
      body: post.body || '',
      category: post.category || 'platform',
      featured: Boolean(post.featured),
      publishNow: Boolean(post.published_at),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePost = async (postId) => {
    if (!supabase) return;
    const confirmed = window.confirm('Delete this news post permanently?');
    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage('');
      const { error } = await supabase.from('news_posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts((current) => current.filter((post) => post.id !== postId));
      if (editingId === postId) resetForm();
      setMessage('News post deleted.');
    } catch (error) {
      setMessage(error?.message || 'Unable to delete news post.');
    } finally {
      setSaving(false);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to manage news posts.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-label-mono tracking-wider uppercase">
            News Command Center
          </span>
          <div>
            <h1 className="text-3xl text-white font-display-lg">{editingId ? 'Edit News Post' : 'Publish News'}</h1>
            <p className="text-on-surface-variant text-sm max-w-2xl">
              Create, update, and publish announcements with a workflow that is ready for a serious operating cadence.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={savePost} disabled={saving} className="bg-primary text-black px-4 py-2 rounded-xl font-label-mono text-xs font-bold disabled:opacity-60">
            {saving ? 'Saving...' : editingId ? 'Update Post' : 'Publish News'}
          </button>
          <button onClick={resetForm} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl font-label-mono text-xs hover:bg-white/10 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {message && <div className="glass-card p-4 rounded-2xl border-white/5 text-on-surface-variant">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border-white/5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-white font-bold">{editingId ? 'Update Post' : 'New Post'}</h2>
              <p className="text-[11px] text-on-surface-variant font-label-mono uppercase tracking-wider">
                {editingId ? 'Editing mode' : 'Draft mode'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="TITLE" value={form.title} onChange={(value) => updateField('title', value)} placeholder="Market update or platform announcement" />
              <Field label="SLUG" value={form.slug} onChange={(value) => updateField('slug', slugify(value))} placeholder="market-update-july" />
            </div>

            <Field label="SUMMARY" as="textarea" value={form.summary} onChange={(value) => updateField('summary', value)} placeholder="Short preview shown in the feed." />
            <Field label="BODY" as="textarea" value={form.body} onChange={(value) => updateField('body', value)} placeholder="Full news article..." rows="10" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CATEGORY" as="select" value={form.category} onChange={(value) => updateField('category', value)} options={categoryOptions} />
              <label className="flex items-center gap-3 text-white text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />
                Featured post
              </label>
            </div>

            <label className="flex items-center gap-3 text-white text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <input type="checkbox" checked={form.publishNow} onChange={(event) => updateField('publishNow', event.target.checked)} />
              Publish immediately
            </label>
          </div>

          <div className="glass-card p-6 rounded-3xl border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-white font-bold">Post Library</h2>
              <span className="text-[11px] text-on-surface-variant font-label-mono uppercase tracking-wider">{posts.length} items</span>
            </div>

            {loading ? (
              <div className="py-6">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-white font-bold truncate">{post.title}</p>
                          <span className={`text-[10px] font-label-mono px-2 py-0.5 rounded ${
                            post.category === 'premium' ? 'bg-primary/20 text-primary'
                              : post.category === 'launch' ? 'bg-green-400/20 text-green-400'
                                : post.category === 'market' ? 'bg-blue-400/20 text-blue-400'
                                  : 'bg-white/10 text-on-surface-variant'
                          }`}>
                            {post.featured ? 'FEATURED' : post.category}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-sm line-clamp-2">{post.summary || 'No summary provided.'}</p>
                        <p className="text-[11px] text-on-surface-variant mt-2 font-label-mono">{post.slug}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEdit(post)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-label-mono hover:bg-white/10">
                          Edit
                        </button>
                        <button onClick={() => deletePost(post.id)} disabled={saving} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-label-mono hover:bg-red-500/20 disabled:opacity-60">
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-on-surface-variant font-label-mono">
                      <span>{post.published_at ? `Published ${new Date(post.published_at).toLocaleDateString()}` : 'Draft'}</span>
                      <span>{post.updated_at ? `Updated ${new Date(post.updated_at).toLocaleDateString()}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-on-surface-variant">No news posts yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border-white/5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-white font-bold">Live Preview</h2>
              <span className="text-[11px] text-on-surface-variant font-label-mono uppercase tracking-wider">Client view</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-label-mono px-2 py-0.5 rounded ${
                  preview.category === 'premium' ? 'bg-primary/20 text-primary'
                    : preview.category === 'launch' ? 'bg-green-400/20 text-green-400'
                      : preview.category === 'market' ? 'bg-blue-400/20 text-blue-400'
                        : 'bg-white/10 text-on-surface-variant'
                }`}>
                  {preview.category}
                </span>
                {preview.featured && <span className="text-[10px] font-label-mono px-2 py-0.5 rounded bg-primary/20 text-primary">FEATURED</span>}
              </div>
              <h3 className="text-white font-bold text-2xl leading-tight">{preview.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{preview.summary}</p>
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                <p className="text-[11px] uppercase tracking-wider font-label-mono text-on-surface-variant mb-2">Body Preview</p>
                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{preview.body}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border-white/5">
            <h3 className="text-white font-bold mb-3">Release Checklist</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li>• Title and slug are normalized before publish.</li>
              <li>• Drafts remain unpublished until you toggle immediate publish.</li>
              <li>• Featured posts stay pinned in the newsroom flow.</li>
              <li>• Edit and delete support keeps the newsroom maintainable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, as = 'input', type = 'text', placeholder = '', options = [], rows = 4 }) {
  return (
    <div>
      <label className="font-label-mono text-[11px] text-on-surface-variant block mb-2">{label}</label>
      {as === 'textarea' ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 resize-none"
        />
      ) : as === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 appearance-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50"
        />
      )}
    </div>
  );
}
