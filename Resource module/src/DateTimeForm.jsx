import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
function DateTimeForm() {
  const [form, setForm] = useState({
    EmpId: '1345004',
    Name:  'Avijit Behera',
    Email: 'princesatya53@gmail.com',
    singleDateTime: '',
    additionalDateTimes: [''],
    instructions: '',
    cv: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [datesError, setDatesError] = useState(null);
  const allowedDays = useMemo(() => {
    if (!availableDates || availableDates.length === 0) return new Set();
    return new Set(availableDates.map(d => dayjs(d).format('YYYY-MM-DD')));
  }, [availableDates]);

  useEffect(() => {
    const fetchDates = async () => {
      setLoadingDates(true);
      setDatesError(null);
      try {
        const res = await fetch('http://localhost:3000/dates');
        if (!res.ok) throw new Error('Failed to fetch dates');
  const data = await res.json();
  // API may return { dates: [...] } or an array directly
  const list = Array.isArray(data) ? data : (Array.isArray(data?.dates) ? data.dates : []);
  setAvailableDates(list);
      } catch {
        setDatesError('Could not load available dates.');
      } finally {
        setLoadingDates(false);
      }
    };
    fetchDates();
  }, []);

  const addMultiDateTime = () => {
    setForm(f => ({ ...f, additionalDateTimes: [...f.additionalDateTimes, ''] }));
  };

  const removeMultiDateTime = (idx) => {
    if (form.additionalDateTimes.length === 1) return;
    setForm(f => ({
      ...f,
      additionalDateTimes: f.additionalDateTimes.filter((_, i) => i !== idx),
    }));
  };

  const handleCVChange = (e) => {
    const file = e.target.files[0] || null;
    if (file && file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      e.target.value = '';
      setForm(f => ({ ...f, cv: null }));
      return;
    }
    setForm(f => ({ ...f, cv: file }));
  };

  // Helper to check if a value (ms or ISO) falls on an allowed day
  function isDateAllowed(val) {
    if (!allowedDays || allowedDays.size === 0) return false; // no allowed days => not allowed
    if (!val && val !== 0) return false;
    const d = dayjs(Number(val));
    if (!d || !d.isValid()) return false;
    return allowedDays.has(d.format('YYYY-MM-DD'));
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDateAllowed(form.singleDateTime)) {
      alert('Please select your availability.');
      return;
    }
    setSubmitting(true);
    const apiUrl = 'http://localhost:3000/submit';
    try {
  const formData = new FormData();
  const singleIso = form.singleDateTime ? dayjs(Number(form.singleDateTime)).format('YYYY-MM-DDTHH:mm:ssZ') : '';
  const optionalIsos = form.additionalDateTimes.filter(Boolean).map(dt => dayjs(Number(dt)).format('YYYY-MM-DDTHH:mm:ssZ'));
  formData.append('EmpId', form.EmpId);
  formData.append('Name', form.Name);
  formData.append('Email', form.Email);
  formData.append('DateTime', singleIso);
  formData.append('optionalDateTimes', JSON.stringify(optionalIsos));
  formData.append('instructions', form.instructions);
      if (form.cv) {
        formData.append('cv', form.cv);
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('Submission response:', data);
    } catch (err) {
      console.log(`Submission failed with error ${err}`);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="date-time-form">
      <h2>Availability Form</h2>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        Debug: allowedDays size = {allowedDays.size} {allowedDays.size > 0 && `; sample: ${Array.from(allowedDays).slice(0,5).join(', ')}`}
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Single Date & Time <span style={{ color: '#e11d48' }}>*</span></label>
          {loadingDates ? (
            <div style={{ color: '#888', margin: '8px 0' }}>Loading available dates...</div>
          ) : datesError ? (
            <div style={{ color: '#e11d48', margin: '8px 0' }}>{datesError}</div>
          ) : (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Single Date & Time"
                value={form.singleDateTime ? (dayjs(Number(form.singleDateTime)).isValid() ? dayjs(Number(form.singleDateTime)) : null) : null}
                onChange={newValue => setForm(f => ({ ...f, singleDateTime: newValue && newValue.isValid() ? newValue.valueOf() : '' }))}
                shouldDisableDate={date => {
                  if (!allowedDays || allowedDays.size === 0) return true; // disable all if none provided
                  return !allowedDays.has(dayjs(date).format('YYYY-MM-DD'));
                }}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    margin: 'dense',
                  }
                }}
                disablePast
                ampm={false}
              />
            </LocalizationProvider>
          )}
        </div>
        <div>
          <label>Additional Date & Time Options</label>
          {form.additionalDateTimes.map((dt, idx) => (
            <div key={idx} className="multi-date-row">
              {loadingDates ? (
                <input type="text" disabled value="Loading..." style={{ width: '100%' }} />
              ) : datesError ? (
                <input type="text" disabled value="No dates" style={{ width: '100%' }} />
              ) : allowedDays.size === 0 ? (
                <input type="text" disabled value="No available dates from server" style={{ width: '100%' }} />
              ) : (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label={`Additional Date & Time ${idx + 1}`}
                    value={dt ? (dayjs(Number(dt)).isValid() ? dayjs(Number(dt)) : null) : null}
                    onChange={newValue => setForm(f => {
                      const next = [...f.additionalDateTimes];
                      next[idx] = newValue && newValue.isValid() ? newValue.valueOf() : '';
                      return { ...f, additionalDateTimes: next };
                    })}
                    // disable dates not in allowedDays
                    shouldDisableDate={date => {
                      if (!allowedDays || allowedDays.size === 0) return true;
                      return !allowedDays.has(dayjs(date).format('YYYY-MM-DD'));
                    }}
                    slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                    disablePast
                    ampm={false}
                  />
                </LocalizationProvider>
              )}
              {form.additionalDateTimes.length > 1 && (
                <button type="button" onClick={() => removeMultiDateTime(idx)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addMultiDateTime}>
            + Add Another
          </button>
        </div>
        <div>
          <label>Optional instructions</label>
          <textarea
            value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            placeholder="Enter instructions (optional)"
            rows={3}
          />
        </div>
        <div>
          <label>Upload CV (PDF/DOC) <span style={{ color: '#e11d48' }}>*</span> </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleCVChange}
            required
          />
          {form.cv && <span className="cv-file-name">{form.cv.name}</span>}
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {/* {result && (
        <div style={{ marginTop: 20 }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
}

export default DateTimeForm;
