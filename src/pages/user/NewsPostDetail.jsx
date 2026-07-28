import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import Panel from '../../components/Panel';
import { motion } from 'framer-motion';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';

const CATEGORY_STYLES = {
  premium: 'bg-primary/15 text-primary',
  launch: 'bg-green-400/15 text-green-400',
  platform: 'bg-blue-400/15 text-blue-400',
};

function categoryClass(category) {
  return CATEGORY_STYLES[(category || '').toLowerCase()] || 'bg-white/10 text-on-surface-variant';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Function to render markdown-like content
function renderBody(body) {
  if (!body) return <p className="text-on-surface-variant text-sm">No content available.</p>;
  
  const lines = body.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];
  let listType = 'ul';
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed === '') {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      return;
    }
    
    // Check for headers
    if (trimmed.startsWith('# ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <h1 key={index} className="text-3xl font-display-lg font-bold text-white mt-8 mb-4">
          {trimmed.substring(2)}
        </h1>
      );
      return;
    }
    
    if (trimmed.startsWith('## ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <h2 key={index} className="text-2xl font-bold text-white mt-6 mb-3">
          {trimmed.substring(3)}
        </h2>
      );
      return;
    }
    
    if (trimmed.startsWith('### ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <h3 key={index} className="text-xl font-bold text-white mt-4 mb-2">
          {trimmed.substring(4)}
        </h3>
      );
      return;
    }
    
    if (trimmed.startsWith('#### ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <h4 key={index} className="text-lg font-bold text-white mt-3 mb-1">
          {trimmed.substring(5)}
        </h4>
      );
      return;
    }
    
    // Check for ordered lists
    if (trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      if (!inList || listType === 'ul') {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc space-y-1 my-3 pl-5">
              {listItems}
            </ul>
          );
          listItems = [];
        }
        inList = true;
        listType = 'ol';
      }
      listItems.push(
        <li key={`li-${index}`} className="text-on-surface-variant text-sm leading-relaxed">
          {renderInlineContent(content)}
        </li>
      );
      return;
    }
    
    // Check for unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      if (!inList || listType === 'ol') {
        if (inList) {
          elements.push(
            <ol key={`list-${index}`} className="list-decimal space-y-1 my-3 pl-5">
              {listItems}
            </ol>
          );
          listItems = [];
        }
        inList = true;
        listType = 'ul';
      }
      listItems.push(
        <li key={`li-${index}`} className="text-on-surface-variant text-sm leading-relaxed">
          {renderInlineContent(content)}
        </li>
      );
      return;
    }
    
    // If we were in a list and now there's a non-list item, close the list
    if (inList) {
      elements.push(
        <ul key={`list-${index}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
    
    // Check for blockquotes
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={index} className="border-l-2 border-primary pl-4 my-3 text-on-surface-variant text-sm italic">
          {trimmed.substring(2)}
        </blockquote>
      );
      return;
    }
    
    // Check for horizontal rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={index} className="border-white/10 my-6" />);
      return;
    }
    
    // Regular paragraph with inline formatting
    elements.push(
      <p key={index} className="text-on-surface-variant text-sm leading-relaxed mb-3">
        {renderInlineContent(trimmed)}
      </p>
    );
  });
  
  // Close any remaining list
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="list-end" className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 my-3 pl-5`}>
        {listItems}
      </ul>
    );
  }
  
  return elements;
}

// Function to render inline content (bold, italic, links, etc.)
function renderInlineContent(text) {
  if (!text) return text;
  
  // Split by patterns
  const parts = [];
  let remaining = text;
  let index = 0;
  
  while (remaining.length > 0) {
    // Check for bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={index} className="text-white font-bold">{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch[0].length);
      index++;
      continue;
    }
    
    // Check for italic *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch && !remaining.startsWith('**')) {
      parts.push(<em key={index} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch[0].length);
      index++;
      continue;
    }
    
    // Check for links [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a 
          key={index} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:text-primary/80 underline transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.substring(linkMatch[0].length);
      index++;
      continue;
    }
    
    // Check for inline code `code`
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      parts.push(
        <code key={index} className="bg-white/5 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.substring(codeMatch[0].length);
      index++;
      continue;
    }
    
    // Regular text
    const nextSpecial = remaining.search(/(\*\*|\*|\[|`)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    }
    if (nextSpecial > 0) {
      parts.push(remaining.substring(0, nextSpecial));
      remaining = remaining.substring(nextSpecial);
    } else {
      // Avoid infinite loop
      parts.push(remaining[0]);
      remaining = remaining.substring(1);
    }
    index++;
  }
  
  return parts.length > 1 ? parts : parts[0] || text;
}

// Main component - make sure this is exported as default
function NewsPostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      if (!hasSupabaseConfig || !supabase) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      try {
        // Fetch the post with author info
        const { data, error: fetchError } = await supabase
          .from('news_posts')
          .select(`
            *,
            author:created_by (
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('slug', slug)
          .single();

        if (fetchError) {
          console.error('Error fetching post:', fetchError);
          setError(fetchError.message);
          setPost(null);
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Post not found');
          setPost(null);
          setLoading(false);
          return;
        }

        setPost(data);

        // Fetch related posts (same category, excluding current)
        const { data: relatedData, error: relatedError } = await supabase
          .from('news_posts')
          .select('*')
          .eq('category', data.category)
          .not('id', 'eq', data.id)
          .not('published_at', 'is', null)
          .order('published_at', { ascending: false })
          .limit(2);

        if (!relatedError && relatedData) {
          setRelatedPosts(relatedData);
        } else {
          setRelatedPosts([]);
        }

      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setPost(null);
      }

      setLoading(false);
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant text-sm">Loading article...</p>
        </div>
      </PageTransition>
    );
  }

  if (error || !post) {
    return (
      <PageTransition className="max-w-4xl mx-auto pb-10">
        <Panel className="p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-white/20 mb-4 block">article</span>
          <h3 className="text-xl text-white font-bold mb-2">Post not found</h3>
          <p className="text-on-surface-variant text-sm mb-6">
            {error || "The article you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate('/dashboard/user/news')}
            className="px-6 py-2.5 bg-primary text-black rounded-full font-label-mono text-xs font-bold hover:bg-primary/80 transition-colors"
          >
            Back to News
          </button>
        </Panel>
      </PageTransition>
    );
  }

  const hasAuthor = post.author && (post.author.full_name || post.author.username);
  const readingTime = post.body ? Math.ceil(post.body.split(/\s+/).length / 200) : 1;

  return (
    <PageTransition className="max-w-4xl mx-auto pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard/user/news')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-white text-sm font-label-mono mb-6 transition-colors group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to News
        </button>

        <Panel className="p-6 sm:p-8 md:p-10">
          {/* Categories */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-[10px] font-label-mono uppercase px-2 py-0.5 rounded tracking-wide ${categoryClass(post.category)}`}>
              {post.category || 'platform'}
            </span>
            {post.featured && (
              <span className="text-[10px] font-label-mono uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 tracking-wide">
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display-lg font-bold text-white mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant mb-6 pb-6 border-b border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {formatDate(post.published_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">access_time</span>
              {readingTime} min read
            </span>
            {hasAuthor && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {post.author.full_name || post.author.username}
                </span>
              </>
            )}
            {post.author?.avatar_url && (
              <img 
                src={post.author.avatar_url} 
                alt={post.author.full_name || post.author.username}
                className="w-6 h-6 rounded-full border border-white/10"
              />
            )}
          </div>

          {/* Summary */}
          {post.summary && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-on-surface-variant text-sm leading-relaxed italic">
                {post.summary}
              </p>
            </div>
          )}

          {/* Body content */}
          <div className="prose prose-invert max-w-none">
            {post.body ? (
              <div className="space-y-0">
                {renderBody(post.body)}
              </div>
            ) : (
              <p className="text-on-surface-variant text-sm">No content available.</p>
            )}
          </div>
        </Panel>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">related_articles</span>
              Related Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/dashboard/user/news/${related.slug}`)}
                  className="text-left p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-primary/30 transition-all group"
                >
                  <span className={`text-[9px] font-label-mono uppercase px-2 py-0.5 rounded ${categoryClass(related.category)} inline-block mb-2`}>
                    {related.category}
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                  <p className="text-on-surface-variant text-xs mt-1 line-clamp-2">
                    {related.summary || (related.body ? related.body.slice(0, 100) + '...' : '')}
                  </p>
                  <div className="text-[10px] text-on-surface-variant/60 mt-2 font-label-mono">
                    {formatDate(related.published_at)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}

// Make sure to export default
export default NewsPostDetail;