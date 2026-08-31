import React, { useState, useRef } from 'react';
import { challengesApi } from '../api/challenges';
import { CameraModal } from './CameraModal';
import { X, Camera, Image, Sparkles } from 'lucide-react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadPopupOpen, setUploadPopupOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (newFiles: FileList | File[]) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    setUploadPopupOpen(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !district.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('district', district.trim());
      const fullDesc = solution.trim()
        ? `${description.trim()}\n\nProposed solution: ${solution.trim()}`
        : description.trim();
      formData.append('description', fullDesc);

      if (files.length > 0) {
        formData.append('file', files[0]);
      }

      await challengesApi.createChallenge(formData);
      onSuccess();
      onClose();
      // Reset
      setTitle('');
      setDistrict('Ranchi');
      setDescription('');
      setSolution('');
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to submit challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>
            <X size={22} />
          </button>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            Submit a Local Challenge
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Report an issue for academic & industry innovation across Jharkhand.
          </p>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                className="input-field"
                placeholder="Briefly describe the challenge..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="district">District *</label>
              <input
                id="district"
                type="text"
                className="input-field"
                placeholder="e.g. Ranchi, Dumka, Dhanbad, Bokaro..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Detailed Description *</label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe the problem, affected community, and location..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="solution">Preferred Solution</label>
              <textarea
                id="solution"
                rows={2}
                placeholder="Suggest a way to resolve this challenge (optional)..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <span className="form-label">Add Media</span>
              <div
                className="upload-area"
                onClick={() => setUploadPopupOpen(!uploadPopupOpen)}
              >
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  {files.length ? `${files.length} file(s) selected` : 'Click to upload photo or video'}
                </span>
              </div>

              {uploadPopupOpen && (
                <div className="upload-popup">
                  <button
                    type="button"
                    className="popup-option"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => {
                      setCameraModalOpen(true);
                      setUploadPopupOpen(false);
                    }}
                  >
                    <Camera size={16} /> Camera
                  </button>
                  <button
                    type="button"
                    className="popup-option"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <Image size={16} /> Gallery
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                }}
              />

              {files.length > 0 && (
                <div className="preview-container">
                  {files.map((f, i) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={i} className="preview-wrapper">
                        {f.type.startsWith('video/') ? (
                          <video src={url} className="media-preview" />
                        ) : (
                          <img src={url} alt="preview" className="media-preview" />
                        )}
                        <button
                          type="button"
                          className="remove-media-btn"
                          onClick={() => removeFile(i)}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
              style={{ padding: '13px', fontSize: '15px' }}
            >
              {loading ? (
                <>
                  <Sparkles size={16} className="animate-spin" /> Classifying & Submitting...
                </>
              ) : (
                'Submit Challenge'
              )}
            </button>
          </form>
        </div>
      </div>

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(file) => handleFiles([file])}
      />
    </>
  );
};
