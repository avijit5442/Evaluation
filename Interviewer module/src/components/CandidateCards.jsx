import React, { useEffect, useState } from 'react';
import './candidateCards.css';
import dayjs from 'dayjs';

export default function CandidateCards() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [modalState, setModalState] = useState({ open: false, candidate: null });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('http://localhost:3000/submissions')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setCandidates(Array.isArray(data) ? data : (data.candidates || []));
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to fetch candidates', err);
        setError(err.message);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="candidate-list">Loading candidates...</div>;
  if (error) return <div className="candidate-list">Error loading candidates: {error}</div>;

  return (
    <div className="candidate-list">
      {candidates.length === 0 && <div>No candidates found</div>}
      {candidates.map((c) => (
        <div className="candidate-card" key={c.id}>
          <div className="card-header">
            <div className="header-top">
              <div className="header-name">{c.Name || '—'}</div>
              <div className="header-emp">{c.EmpId || '—'}</div>
            </div>
            <div className="header-email">{c.Email || '—'}</div>
            <div className="created">Application Received at : {dayjs(c.createdAt).format('YYYY-MM-DD HH:mm')}</div>
          </div>
          <div className="card-body">
            <div><strong>Selected:</strong> {dayjs(c.DateTime).format('YYYY-MM-DD HH:mm Z')}</div>
            <div>
              <strong>Optional:</strong>{' '}
              {(() => {
                const val = c.optionalDateTimes;
                // if it's already an array
                if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
                if (typeof val === 'string') {
                  try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed.length ? parsed.join(', ') : '—';
                  } catch {
                    // not JSON, try comma-separated
                    const parts = val.split(',').map(s => s.trim()).filter(Boolean);
                    if (parts.length) return parts.join(', ');
                  }
                }
                return '—';
              })()}
            </div>
            <div><strong>Instructions:</strong> {c.instructions ?? '—'}</div>
          </div>
          <div className="card-footer">
            <div className="footer-actions">
              <button
                className="icon-button"
                type="button"
                title="Open in Teams"
                onClick={() => {
                  // prefer opening chat to candidate email if available
                  if (c.Email) {
                    const chatUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(c.Email)}`;
                    window.open(chatUrl, '_blank', 'noopener');
                    return;
                  }
                  const teamsUrl = `https://teams.microsoft.com/l/meetup-join/0/0?subject=Interview%20${encodeURIComponent(c.Name)}`;
                  window.open(teamsUrl, '_blank', 'noopener');
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3.5l4 4v-11l-4 4z" fill="#1e88e5"/>
                </svg>
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => setModalState({ open: true, candidate: c.EmpId })}
              >
                Send feedback
              </button>
            </div>
            {c.file && (
              <button
                className="download-link"
                onClick={async () => {
                  try {
                    setDownloadingIds(prev => new Set(prev).add(c.id));
                    const path = c.file.path.startsWith('http') ? c.file.path : `http://localhost:3000/${c.file.path}`;
                    const res = await fetch(path);
                    if (!res.ok) throw new Error('Failed to download file');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = c.file.originalName || 'file';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Download error', err);
                    alert('Could not download file: ' + (err.message || 'unknown'));
                  } finally {
                    setDownloadingIds(prev => {
                      const copy = new Set(prev);
                      copy.delete(c.id);
                      return copy;
                    });
                  }
                }}
                type="button"
                disabled={downloadingIds.has(c.id)}
              >
                {downloadingIds.has(c.id) ? 'Downloading...' : 'Download Resume'}
              </button>
            )}
          </div>
        </div>
      ))}
      {modalState.open && (
          <FeedbackModal
          candidate={modalState.candidate}
          onClose={() => setModalState({ open: false, candidate: null })}
          onSubmit={async (payload) => {
            try {
              // ensure candidateId is included
              const body = { EmpId: modalState.candidate || modalState.candidate, ...payload };
              await fetch('http://localhost:3000/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              alert('Feedback submitted');
            } catch (err) {
              console.error('Feedback submit error', err);
              alert('Could not submit feedback');
            }
            setModalState({ open: false, candidate: null });
          }}
        />
      )}
    </div>
  );
}

function FeedbackModal({ candidate, onClose, onSubmit }) {
  const [form, setForm] = React.useState({
    workMode: '', Location: '', projectConfirmation: '', leavePlans: '', experience: '',
    skill: '', communication: '', technicalKnowledge: '', status: '', feedback: '', additionalFeedback: ''
  });

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Send feedback for {candidate?.Name ?? candidate?.id} {candidate?.EmpId ? `(${candidate.EmpId})` : ''}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
            <div className="modal-grid">
              <input placeholder="Ready to work in Hybrid mode ?" value={form.workMode} onChange={e => update('workMode', e.target.value)} />
              <input placeholder="Location Constraint" value={form.Location} onChange={e => update('Location', e.target.value)} />
              <input placeholder="Project Confirmation" value={form.projectConfirmation} onChange={e => update('projectConfirmation', e.target.value)} />
              <input placeholder="Long Leave Plans" value={form.leavePlans} onChange={e => update('leavePlans', e.target.value)} />
              <input placeholder="Experience" value={form.experience} onChange={e => update('experience', e.target.value)} />
              <input placeholder="Skills" value={form.skill} onChange={e => update('Skills', e.target.value)} />
              <input placeholder="Communication" value={form.communication} onChange={e => update('communication', e.target.value)} />
              <input placeholder="technicalKnowledge" value={form.technicalKnowledge} onChange={e => update('technicalKnowledge', e.target.value)} />
              <select value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="">Select status</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="hold">Hold</option>
              </select>
              <textarea placeholder="Feedback" value={form.feedback} onChange={e => update('feedback', e.target.value)} />
              <textarea placeholder="Additional feedback" value={form.additionalFeedback} onChange={e => update('additionalFeedback', e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
