import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';

export default function CreateCourse() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    access_tier: 'free',
    duration: '',
    instructor: 'TradePad Academy',
  });

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  // Load course details if editing
  useEffect(() => {
    if (!id || !supabase) return;
    const loadCourse = async () => {
      try {
        setMessage('Loading course details...');
        const { data: course, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!course) {
          setMessage('Course not found.');
          return;
        }

        setForm({
          title: course.title || '',
          description: course.description || '',
          video_url: course.video_url || '',
          thumbnail_url: course.thumbnail_url || '',
          access_tier: course.access_tier || 'free',
          duration: course.duration || '',
          instructor: course.instructor || 'TradePad Academy',
        });
        setMessage('');
      } catch (err) {
        console.error('Error loading course details:', err);
        setMessage('Failed to load course details.');
      }
    };
    loadCourse();
  }, [id]);

  const handleFileUpload = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;

    if (type === 'video') setUploadingVideo(true);
    else setUploadingThumbnail(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `courses/${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('membucket')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('membucket')
        .getPublicUrl(filePath);

      if (type === 'video') {
        updateField('video_url', publicUrl);
      } else {
        updateField('thumbnail_url', publicUrl);
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      if (type === 'video') setUploadingVideo(false);
      else setUploadingThumbnail(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) {
      setMessage('Connect Supabase first.');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      if (!form.title) {
        throw new Error('Course Title is required.');
      }

      if (isEditing) {
        const { error } = await supabase
          .from('courses')
          .update({
            title: form.title,
            description: form.description,
            video_url: form.video_url,
            thumbnail_url: form.thumbnail_url,
            access_tier: form.access_tier,
            duration: form.duration,
            instructor: form.instructor,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        setMessage('Course updated successfully.');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            title: form.title,
            description: form.description,
            video_url: form.video_url,
            thumbnail_url: form.thumbnail_url,
            access_tier: form.access_tier,
            duration: form.duration,
            instructor: form.instructor,
          });

        if (error) throw error;
        setMessage('Course created successfully.');
      }

      navigate('/dashboard/admin/courses');
    } catch (err) {
      console.error('Error saving course:', err);
      setMessage(err.message || 'Unable to save course.');
    } finally {
      setSaving(false);
    }
  };

  if (!hasSupabaseConfig) {
    return <div className="glass-card p-6 border-white/5 rounded-2xl text-on-surface-variant">Connect Supabase to configure courses.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-white mb-2">
            {isEditing ? 'Edit Academy Course' : 'Create Academy Course'}
          </h1>
          <p className="text-on-surface-variant text-sm">
            Publish educational video tutorials, Solana masterclasses, and onboarding videos.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard/admin/courses')} className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-mono text-xs hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-primary text-black px-6 py-2.5 rounded-xl font-mono text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-60">
            {saving ? 'Saving...' : isEditing ? 'Update Course' : 'Publish Course'}
          </button>
        </div>
      </div>

      {message && <div className="glass-card p-4 rounded-2xl border-white/5 text-on-surface-variant">{message}</div>}

      <div className="glass-card p-8 rounded-3xl border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="COURSE TITLE" value={form.title} onChange={(value) => updateField('title', value)} placeholder="e.g. Solana Memecoin Basics" />
          <Field label="ACCESS TIER" as="select" value={form.access_tier} onChange={(value) => updateField('access_tier', value)} options={['free', 'premium']} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="INSTRUCTOR" value={form.instructor} onChange={(value) => updateField('instructor', value)} placeholder="e.g. TradePad Operations" />
          <Field label="DURATION" value={form.duration} onChange={(value) => updateField('duration', value)} placeholder="e.g. 15 min" />
        </div>

        <Field as="textarea" label="COURSE DESCRIPTION" value={form.description} onChange={(value) => updateField('description', value)} placeholder="Explain what users will learn in this lecture..." />

        {/* Thumbnail Selector */}
        <div className="space-y-2">
          <label className="font-mono text-[11px] text-on-surface-variant block uppercase tracking-wider">Course Thumbnail</label>
          <div className="flex gap-4 items-center">
            {form.thumbnail_url && (
              <img src={form.thumbnail_url} alt="Course Thumbnail Preview" className="w-16 h-10 rounded-lg object-cover border border-white/10" />
            )}
            <div className="flex-1 relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'thumbnail')}
                className="hidden"
                id="thumbnail-upload-input"
              />
              <label 
                htmlFor="thumbnail-upload-input" 
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between transition-colors"
              >
                <span>{uploadingThumbnail ? 'Uploading Thumbnail...' : 'Upload Thumbnail Image'}</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">upload_file</span>
              </label>
            </div>
          </div>
          <input
            type="text"
            value={form.thumbnail_url}
            onChange={(e) => updateField('thumbnail_url', e.target.value)}
            placeholder="Or enter thumbnail image URL manually"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none mt-2 focus:border-primary/50"
          />
        </div>

        {/* Video Upload / Google Drive input */}
        <div className="space-y-2">
          <label className="font-mono text-[11px] text-on-surface-variant block uppercase tracking-wider">Video Lecture File / Link</label>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input 
                type="file" 
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'video')}
                className="hidden"
                id="video-upload-input"
              />
              <label 
                htmlFor="video-upload-input" 
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between transition-colors"
              >
                <span>{uploadingVideo ? 'Uploading Video (Please wait)...' : 'Upload Video File (.mp4, etc)'}</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">video_file</span>
              </label>
            </div>
          </div>
          <input
            type="text"
            value={form.video_url}
            onChange={(e) => updateField('video_url', e.target.value)}
            placeholder="Or enter Video URL / Google Drive link (e.g. https://drive.google.com/file/d/.../view)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none mt-2 focus:border-primary/50"
          />
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            * Note: If inputting a Google Drive link, ensure the file is set to "Anyone with the link can view". The platform will automatically convert it to an embeddable format.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, as = 'input', type = 'text', placeholder = '', options = [] }) {
  return (
    <div>
      <label className="font-mono text-[11px] text-on-surface-variant block mb-2 uppercase tracking-wider">{label}</label>
      {as === 'textarea' ? (
        <textarea
          rows="4"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50"
        />
      ) : as === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 appearance-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option.toUpperCase()}
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
