import React, { useState, useEffect, useRef } from 'react';
import { dashboardsApi } from '../api/dashboards';
import { useAuth } from '../context/AuthContext';
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
  Tag,
  FileText,
} from 'lucide-react';

import { WEST_BENGAL_DISTRICTS, JHARKHAND_DISTRICTS } from '../constants/districts';

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

  // Submission Form State
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('Kolkata');
  const [category, setCategory] = useState('Let AI Automatically Classify');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; file: File; isVideo: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [error, setError] = useState('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to submit a problem.');
      onNavigateLogin();
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please provide a challenge title and description.');
      return;
    }

    setSubmitting(true);
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
      if (files.length > 0) {
        files.forEach((f) => formData.append('file', f));
      }

      const res = await dashboardsApi.submitProblem(formData);
      setSubmitSuccess(res);
      // Reset form
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-page-container">
      <div className="submit-card-wrapper">
        <div className="submit-card-header">
          <div className="submit-badge-pill">
            <Sparkles size={14} color="#2563eb" /> AI-Powered Crowdsourcing
          </div>
          <h2 className="submit-main-title">Submit a Societal Challenge</h2>
          <p className="submit-subtitle">
            Report civic, environmental, agricultural, or infrastructure challenges. Gemma 2 AI
            will automatically analyze, prioritize, and route this to university labs.
          </p>
        </div>

        {error && (
          <div className="auth-error-alert" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="submission-success-banner animate-fade-in">
            <div className="success-banner-title">
              <CheckCircle size={22} /> Challenge Submitted & AI Classified!
            </div>
            <p className="success-banner-desc">
              Your problem has been registered and routed to university innovation labs across
              Jharkhand.
            </p>
            {submitSuccess.category && (
              <div className="success-category-tag">
                <Tag size={13} style={{ marginRight: 4 }} /> AI Category: {submitSuccess.category}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="submit-form">
          <div className="form-group">
            <label htmlFor="p-title" className="form-label">
              <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
              Challenge Title *
            </label>
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

          <div className="form-responsive-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                District *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="input-field select-field"
              >
                <optgroup label="West Bengal">
                  {WEST_BENGAL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Jharkhand">
                  {JHARKHAND_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                <Tag size={14} style={{ display: 'inline', marginRight: 4 }} />
                Category (Optional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field select-field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p-desc" className="form-label">
              Detailed Description *
            </label>
            <textarea
              id="p-desc"
              rows={4}
              className="input-field textarea-field"
              placeholder="Describe the affected community, symptoms, severity, and any existing measures taken..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Camera size={14} style={{ display: 'inline', marginRight: 4 }} />
              Evidence Media (Photo/Video)
            </label>

            {/* Uploaded File Previews Grid */}
            {files.length > 0 && (
              <div className="media-preview-grid">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="media-preview-card">
                    {preview.isVideo ? (
                      <video src={preview.url} className="preview-media-item" />
                    ) : (
                      <img
                        src={preview.url}
                        alt={preview.file.name}
                        className="preview-media-item"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="preview-remove-btn"
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <X size={14} />
                    </button>
                    <div className="preview-filename-badge">{preview.file.name}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Drop Zone Trigger */}
            <div
              className="upload-drop-zone"
              onClick={() => setShowMediaOptions(true)}
            >
              <UploadCloud size={30} color="#2563eb" style={{ margin: '0 auto 8px' }} />
              <span className="upload-main-text">
                {files.length > 0 ? '+ Add More Evidence' : 'Tap to Upload Photo or Video'}
              </span>
              <span className="upload-sub-text">
                Camera capture, PNG, JPG, WEBP, or MP4 (Max 10MB)
              </span>
            </div>

            {/* Mobile / Desktop Media Options Popup / Bottom Sheet */}
            {showMediaOptions && (
              <div
                className="media-modal-backdrop"
                onClick={() => setShowMediaOptions(false)}
              >
                <div
                  className="media-options-sheet animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sheet-handle-bar" />
                  <h4 className="sheet-title">Add Evidence Media</h4>

                  <button
                    type="button"
                    className="sheet-option-btn"
                    onClick={() => {
                      setShowMediaOptions(false);
                      fileInputCameraRef.current?.click();
                    }}
                  >
                    <div className="sheet-option-icon camera-icon">
                      <Camera size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong>Take Photo / Video</strong>
                      <p>Open device camera directly</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="sheet-option-btn"
                    onClick={() => {
                      setShowMediaOptions(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="sheet-option-icon gallery-icon">
                      <ImageIcon size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong>Choose from Gallery</strong>
                      <p>Select existing files from storage</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="sheet-cancel-btn"
                    onClick={() => setShowMediaOptions(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const newFiles = Array.from(e.target.files);
                  setFiles((prev) => [...prev, ...newFiles]);
                }
              }}
            />
            <input
              type="file"
              ref={fileInputCameraRef}
              accept="image/*,video/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const snapped = e.target.files[0];
                  setFiles((prev) => [...prev, snapped]);
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary submit-submit-btn"
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
    </div>
  );
};
