import React, { useState, useEffect, useRef } from 'react';
import { dashboardsApi } from '../api/dashboards';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { CameraModal } from '../components/CameraModal';
import {
  Send,
  UploadCloud,
  CheckCircle,
  Sparkles,
  AlertCircle,
  X,
  Camera,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react';
import exifr from 'exifr';

import { WEST_BENGAL_DISTRICTS, JHARKHAND_DISTRICTS } from '../constants/districts';

const validateImageSecurity = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  if (!file.type.startsWith('image/')) return { valid: true };

  try {
    const exifData = await exifr.parse(file, ['Make', 'Model', 'FNumber', 'ExposureTime', 'ISO', 'Software']);

    if (exifData?.Software && (exifData.Software.toLowerCase().includes('midjourney') || exifData.Software.toLowerCase().includes('dall-e') || exifData.Software.toLowerCase().includes('stable diffusion'))) {
       return { valid: false, error: 'AI generation software signature detected in image metadata.' };
    }

    const hasHardwareMetrics = exifData && (exifData.FNumber || exifData.ExposureTime || exifData.ISO);

    if (!hasHardwareMetrics) {
      return {
        valid: false,
        error: 'PRIVATE_SHARE_ERROR',
      };
    }

    return { valid: true };
  } catch (err) {
    console.error('EXIF validation error:', err);
    return {
      valid: false,
      error: 'PRIVATE_SHARE_ERROR',
    };
  }
};


const PRIVATE_SHARE_STEPS = [
  {
    brand: 'Android Gallery (options name may vary)',
    color: '#1428a0',
    bg: '#e8eaf6',
    steps: [
      'Open your Android Gallery app.',
      'Tap the photo you want to share.',
      'Tap the ⋮ (three-dot menu) or settings icon.',
      'Tap "Details" → Look for "Remove location data" — make sure it is OFF.',
      'Look for "Private Share" or "Remove Metadata" options and toggle them OFF.',
      'Now re-select the photo and upload it again.',
    ],
  },
  {
    brand: 'Google Photos',
    color: '#1a73e8',
    bg: '#e8f0fe',
    steps: [
      'Open Google Photos.',
      'Tap the photo you want to upload.',
      'Tap ⋮ (three dots) at top-right.',
      'Tap "Download" to save a full copy to your device.',
      'Upload that downloaded photo — it retains EXIF metadata.',
    ],
  },
  {
    brand: 'iPhone (iOS)',
    color: '#555',
    bg: '#f1f5f9',
    steps: [
      'Open the Photos app and select your photo.',
      'Tap the Share icon (square with arrow pointing up).',
      'In the share sheet, look for "Options" at the very top.',
      'Tap "Options" → toggle "Include Location" and "All Photos Data" to ON.',
      'Now export/share the photo — full EXIF data will be preserved.',
    ],
  },
];

const PrivateShareGuide: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [openBrand, setOpenBrand] = React.useState<number | null>(null);
  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertCircle size={20} color="#b45309" />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#92400e' }}>Missing Camera Metadata</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#78350f' }}>This photo has no ISO / Shutter Speed data. We can't verify it's a real photo.</p>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', flexShrink: 0 }}><X size={18} /></button>
      </div>

      <p style={{ fontSize: '13.5px', color: '#78350f', marginBottom: '14px', lineHeight: 1.6 }}>
        📌 <strong>If this is a real photo taken on your phone</strong>, your gallery's <strong>"Private Share"</strong> or <strong>"Remove Metadata"</strong> setting is stripping the camera info. Tap your phone below for a step-by-step fix:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PRIVATE_SHARE_STEPS.map((brand, i) => (
          <div key={i} style={{ borderRadius: '8px', border: `1px solid ${brand.color}30`, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpenBrand(openBrand === i ? null : i)}
              style={{ width: '100%', padding: '12px 16px', background: brand.bg, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px', color: brand.color, textAlign: 'left' }}
            >
              {brand.brand}
              <span style={{ fontSize: '18px', display: 'inline-block', transform: openBrand === i ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>›</span>
            </button>
            {openBrand === i && (
              <ol style={{ margin: 0, padding: '12px 16px 12px 36px', background: '#fff', fontSize: '13.5px', color: '#374151', lineHeight: 1.8 }}>
                {brand.steps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '12.5px', color: '#92400e', marginTop: '12px', marginBottom: 0 }}>
        💡 <strong>Tip:</strong> The easiest fix is to use the <strong>"Take a Photo"</strong> option in this form — live camera photos always include full metadata and are accepted instantly.
      </p>
    </div>
  );
};

const CATEGORIES = [
  'Let AI Automatically Classify',
  'Water & Sanitation',
  'Healthcare',
  'Education',
  'Agriculture',
  'Urban Infrastructure',
  'Environment & Forestry',
  'Clean Energy',
  'Rural Livelihoods',
  'Accessibility & Inclusion',
  'Public Administration',
];

export const ProblemEntryDashboard: React.FC<{ onNavigateLogin: () => void }> = ({
  onNavigateLogin,
}) => {
  const { isAuthenticated } = useAuth();
  const { showAlert, setGlobalLoading } = useUI();

  // Submission Form State
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('Kolkata');
  const [category, setCategory] = useState('Let AI Automatically Classify');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; file: File; isVideo: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isVideo: file.type.startsWith('video/'),
    }));
    setFilePreviews(previews);

    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [files]);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPrivateShareGuide, setShowPrivateShareGuide] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showAlert('Please sign in to submit a problem.', 'error');
      onNavigateLogin();
      return;
    }

    if (!title.trim() || !description.trim() || !locationText.trim()) {
      setError('Please provide a title, description, and exact location.');
      showAlert('Please provide a title, description, and exact location.', 'error');
      return;
    }

    if (!locationText.trim()) {
      setError('Please provide a precise GPS location URL.');
      showAlert('Please provide a precise GPS location URL.', 'error');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one authentic photo of the issue.');
      showAlert('Please upload at least one authentic photo of the issue.', 'error');
      return;
    }

    setSubmitting(true);
    setGlobalLoading(true);
    setError('');
    setSubmitSuccess(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('district', district);
      formData.append('description', description.trim());
      if (category !== 'Let AI Automatically Classify') {
        formData.append('category', category);
      }
      if (locationText.trim()) {
        formData.append('location_text', locationText.trim());
      }
      if (files.length > 0) {
        files.forEach((f) => formData.append('file', f));
      }

      const res = await dashboardsApi.submitProblem(formData);
      setSubmitSuccess(res);
      // Reset form
      setTitle('');
      setDescription('');
      setLocationText('');
      setFiles([]);
      
      showAlert('Problem submitted successfully!', 'success');

      // Add a slight delay to allow the user to read the success message
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }));
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Submission failed.');
      showAlert(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationText(`https://www.google.com/maps?q=${lat},${lng}`);
        setLocationLoading(false);
        showAlert('Location captured successfully!', 'success');
      },
      (error) => {
        setLocationLoading(false);
        showAlert('Failed to get location. Please allow location permissions or enter manually.', 'error');
      }
    );
  };

  return (
    <div className="problem-entry-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px 80px' }}>
      <div className="problem-entry-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div className="problem-entry-header" style={{ marginBottom: '24px' }}>
            <h2 className="problem-entry-title" style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Submit a Societal Challenge</h2>
            <p className="problem-entry-subtitle" style={{ color: '#64748b', fontSize: '14.5px', marginTop: '4px', lineHeight: 1.5 }}>
              Report local civic, environmental, agricultural, or infrastructure challenges. Powered by automated AI classification & routing.
            </p>
          </div>

          {error && !showPrivateShareGuide && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {submitSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                <CheckCircle size={20} /> Challenge Submitted & AI Classified!
              </div>
              <p style={{ fontSize: '14px', color: '#166534', margin: '0 0 10px' }}>
                Your problem has been routed to university innovation labs across Jharkhand.
              </p>
              {submitSuccess.category && (
                <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                  <span className="tag tag-category">Category: {submitSuccess.category}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="p-title">Challenge Title *</label>
              <input
                id="p-title"
                type="text"
                className="input-field"
                placeholder="e.g. Arsenic Contamination in Borewell Water Supply"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">District *</label>
                <select className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <optgroup label="West Bengal">
                    {WEST_BENGAL_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Jharkhand">
                    {JHARKHAND_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="form-label">Category (Optional)</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="p-desc">Detailed Description *</label>
              <textarea
                id="p-desc"
                rows={4}
                placeholder="Describe the affected community, symptoms, severity, and any existing measures taken..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="p-location">Exact Location *</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  id="p-location"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Google Maps link or Village Name"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  style={{ flex: '1 1 200px', minWidth: '200px' }}
                  required
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontWeight: 600,
                    cursor: locationLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    flex: '1 0 auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <MapPin size={18} color="#2563eb" />
                  {locationLoading ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Evidence Media (Photo/Video)</label>
              {showPrivateShareGuide && (
                <div style={{ marginTop: '8px' }}>
                  <PrivateShareGuide onDismiss={() => { setShowPrivateShareGuide(false); setError(''); }} />
                </div>
              )}
              {files.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  {filePreviews.map((preview, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        height: '110px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '2px solid #e2e8f0',
                        background: '#f8fafc',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      {preview.isVideo ? (
                        <video
                          src={preview.url}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <img
                          src={preview.url}
                          alt={preview.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      {/* AI Check status badge */}
                      <button
                        type="button"
                        onClick={() => {
                          setFiles((prev) => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                        title="Remove photo"
                      >
                        <X size={14} />
                      </button>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '3px 6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {preview.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <div
                  className="upload-area"
                  onClick={() => setShowMediaOptions(true)}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <UploadCloud size={28} style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                  <span style={{ fontSize: '14px', color: '#334155', fontWeight: 600, display: 'block' }}>
                    {files.length > 0 ? '+ Add More Photos/Videos' : 'Click to Upload Photos or Video'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    PNG, JPG, WEBP, or MP4 (Max 10MB each)
                  </span>
                </div>

                {showMediaOptions && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    width: '240px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaOptions(false);
                        setShowCameraModal(true);
                      }}
                      style={{ padding: '14px 16px', background: 'none', border: 'none', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#0f172a', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Camera size={18} color="#2563eb" /> Take a Photo/Video
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaOptions(false);
                        fileInputRef.current?.click();
                      }}
                      style={{ padding: '14px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#0f172a', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <ImageIcon size={18} color="#2563eb" /> Choose from Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMediaOptions(false)}
                      style={{ padding: '10px 16px', background: '#f8fafc', border: 'none', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                onChange={async (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files);
                    const validFiles: File[] = [];
                    for (const f of newFiles) {
                      const result = await validateImageSecurity(f);
                      if (result.valid) {
                        validFiles.push(f);

                      } else if (result.error === 'PRIVATE_SHARE_ERROR') {
                        setShowPrivateShareGuide(true);
                        showAlert('Camera metadata missing. See the guide above the upload button.', 'error');
                        setError('');
                      } else {
                        setError(result.error!);
                        showAlert(result.error!, 'error');
                      }
                    }
                    if (validFiles.length > 0) {
                      setFiles((prev) => [...prev, ...validFiles]);
                    }
                  }
                  // Reset input value so same file can be selected again if needed
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
              <input
                type="file"
                ref={fileInputCameraRef}
                accept="image/*,video/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const snapped = e.target.files[0];
                    const result = await validateImageSecurity(snapped);
                    if (result.valid) {
                      setFiles((prev) => [...prev, snapped]);
                    } else if (result.error === 'PRIVATE_SHARE_ERROR') {
                      setShowPrivateShareGuide(true);
                      showAlert('Camera metadata missing. See the guide above the upload button.', 'error');
                      setError('');
                    } else {
                      setError(result.error!);
                      showAlert(result.error!, 'error');
                    }
                  }
                  if (fileInputCameraRef.current) fileInputCameraRef.current.value = '';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-100"
              style={{ padding: '14px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? (
                <>
                  <Sparkles size={18} className="animate-spin" /> Analyzing & Submitting with AI...
                </>
              ) : (
                <>
                  <Send size={18} /> Submit Challenge to Platform
                </>
              )}
            </button>
          </form>
      </div>

      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => setFiles((prev) => [...prev, file])}
      />
    </div>
  );
};
