import React, { useState } from 'react';
import { challengesService } from '../../services/challenges.service';
import { JHARKHAND_DISTRICTS } from '../../services/mockData';
import { GeolocationPicker } from '../gis/GeolocationPicker';
import { useNotifications } from '../../context/NotificationContext';
import { Challenge } from '../../types/challenge.types';
import confetti from 'canvas-confetti';
import {
  Send,
  UploadCloud,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Brain,
  X,
  FileImage
} from 'lucide-react';

interface ChallengeFormProps {
  onSuccess: (newChallenge: Challenge) => void;
  onCancel?: () => void;
}

export const ChallengeForm: React.FC<ChallengeFormProps> = ({ onSuccess, onCancel }) => {
  const { addToast } = useNotifications();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState(JHARKHAND_DISTRICTS[7]); // Dumka default
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number>(24.2694);
  const [longitude, setLongitude] = useState<number>(87.2476);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<Challenge | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      addToast({ title: 'Validation Error', message: 'Please provide both title and description.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('district', district);
      formData.append('location_text', locationText || `Ward 1, ${district}`);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const created = await challengesService.createChallenge(formData);

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      addToast({
        title: 'Problem Submitted & AI Routed!',
        message: `Classified as ${created.ai_classification?.categoryName || 'Water'} with ${created.priority_score} Severity. Routed to ${created.institutions?.name || 'BIT Sindri'}.`,
        type: 'success',
      });

      setAiResult(created);
    } catch (err: any) {
      addToast({ title: 'Submission Error', message: err.message || 'Failed to submit challenge', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (aiResult) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: 'var(--emerald-500)',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Challenge Successfully Lodged!
        </h3>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Google AI Studio Gemma 2 model has triaged your submission, assessed priority severity, and automatically routed the challenge for engineering resolution.
        </p>

        {/* AI summary badge card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Brain size={18} color="#10b981" />
            <strong style={{ color: '#ffffff', fontSize: '1rem' }}>AI Triage Summary:</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Category:</span>
              <strong style={{ color: '#38bdf8' }}>{aiResult.ai_classification?.categoryName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Severity Score:</span>
              <strong style={{ color: '#f59e0b' }}>{aiResult.priority_score}/100</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Assigned Institution:</span>
              <strong style={{ color: '#ffffff' }}>{aiResult.institutions?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>District:</span>
              <strong style={{ color: '#ffffff' }}>{aiResult.district}</strong>
            </div>
          </div>

          {aiResult.ai_classification?.rationale && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              {aiResult.ai_classification.rationale}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            onSuccess(aiResult);
          }}
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
        >
          View in My Challenges Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Submit a Grassroots Societal Problem
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Empower your community in Jharkhand by lodging local infrastructure, water, healthcare, or agricultural challenges.
          </p>
        </div>

        <div className="glass-pill" style={{ color: '#10b981' }}>
          <Sparkles size={14} /> AI Gemma Triage
        </div>
      </div>

      {/* Form Fields */}
      <div className="form-group">
        <label className="form-label">
          Problem Title *
        </label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Arsenic Contamination in Village Borewells, Kathikund"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Detailed Problem Statement *
        </label>
        <textarea
          className="form-textarea"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the affected population, severity of impact, duration, and urgent on-ground requirements..."
          required
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {description.length} characters (AI will extract keywords and assess severity automatically)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">
            Jharkhand District *
          </label>
          <select
            className="form-select"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          >
            {JHARKHAND_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Village / Landmark / Ward Text
          </label>
          <input
            type="text"
            className="form-input"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="e.g. Near Panchayat Bhavan, Ward 4"
          />
        </div>
      </div>

      {/* GPS Geolocation Picker */}
      <div style={{ marginBottom: '1.25rem' }}>
        <GeolocationPicker
          latitude={latitude}
          longitude={longitude}
          locationText={locationText}
          onLocationChange={(lat, lng, loc) => {
            setLatitude(lat);
            setLongitude(lng);
            if (loc) setLocationText(loc);
          }}
        />
      </div>

      {/* File Upload Dropzone */}
      <div className="form-group">
        <label className="form-label">
          Photo Evidence / Field Document (Optional)
        </label>
        <div
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
            background: 'var(--bg-glass)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
            }}
          />
          {previewUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <img
                src={previewUrl}
                alt="Upload preview"
                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFile?.name}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--emerald-500)' }}>
                  Image attached. Click to replace.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={32} color="#10b981" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Click or drag & drop photo evidence
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Supports JPG, PNG, WEBP (Max 10MB)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-lg"
          style={{ gap: '0.5rem' }}
        >
          {isSubmitting ? (
            <>
              <Sparkles size={18} className="animate-spin" />
              <span>Analyzing with Gemma AI...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Submit & Auto-Route Problem</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
