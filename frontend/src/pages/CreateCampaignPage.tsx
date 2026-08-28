import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date || !form.location) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/campaigns', form);
      toast.success('Campaign created successfully!');
      navigate('/campaigns');
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

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Create New Campaign</h1>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div>
          <label className="label">Campaign Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., Beach Cleanup Drive"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the campaign, goals, and what volunteers will do..."
            rows={5}
            className="input-field resize-none"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
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
              placeholder="e.g., Central Park, NY"
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            <Send size={18} />
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
          <button type="button" onClick={() => navigate('/campaigns')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
