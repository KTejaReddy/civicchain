import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Send } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { Campaign } from '@/types';

export default function SubmitContributionPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({
    campaignId: '',
    hours: '',
    description: '',
    location: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns?status=ACTIVE');
      setCampaigns(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setCampaigns([]);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campaignId || !form.hours || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('campaignId', form.campaignId);
      formData.append('hours', form.hours);
      formData.append('description', form.description);
      formData.append('location', form.location);
      if (file) {
        formData.append('proof', file);
      }

      await api.post('/contributions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Contribution submitted successfully!');
      navigate('/dashboard');
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Submit Contribution</h1>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div>
          <label className="label">Campaign *</label>
          <select
            name="campaignId"
            value={form.campaignId}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select a campaign...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Hours Worked *</label>
            <input
              type="number"
              name="hours"
              value={form.hours}
              onChange={handleChange}
              min="0.5"
              step="0.5"
              placeholder="e.g., 4"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Where did you volunteer?"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what you did and any notable achievements..."
            rows={4}
            className="input-field resize-none"
            required
          />
        </div>

        <div>
          <label className="label">Evidence (optional)</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto text-gray-400 mb-3" size={32} />
            {file ? (
              <div>
                <p className="text-sm font-medium text-primary-600">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            <Send size={18} />
            {submitting ? 'Submitting...' : 'Submit Contribution'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
