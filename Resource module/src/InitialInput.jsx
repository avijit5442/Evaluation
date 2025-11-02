// Replace the entire file with this content
import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';

function InitialInput() {
  // Field error states
  const [fieldErrors, setFieldErrors] = useState({
    singleDateTime: false,
    projectConfirmation: false,
    LongLeavePlans: false,
    LocationPreference: false
  });

  const [form, setForm] = useState({
    EmpId: '1345004',
    Name: 'Avijit Behera',
    Email: 'princesatya53@gmail.com',
    singleDateTime: '',
    additionalDateTimes: [''],
    projectConfirmation: '',
    alconScreenshot: null,
    LongLeavePlans: '',
    leavePlanDetails: '',
    LocationPreference: '',
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

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0] || null;
    if (file && file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      e.target.value = '';
      setForm(f => ({ ...f, [fieldName]: null }));
      return;
    }
    setForm(f => ({ ...f, [fieldName]: file }));
  };

  const handleCVChange = (e) => handleFileChange(e, 'cv');
  const handleAlconScreenshotChange = (e) => handleFileChange(e, 'alconScreenshot');

  // Helper to check if a value (ms or ISO) falls on an allowed day
  function isDateAllowed(val) {
    if (!allowedDays || allowedDays.size === 0) return false;
    if (!val && val !== 0) return false;
    const d = dayjs(Number(val));
    if (!d || !d.isValid()) return false;
    return allowedDays.has(d.format('YYYY-MM-DD'));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset all field errors
    const newErrors = {
      singleDateTime: false,
      projectConfirmation: false,
      LongLeavePlans: false,
      LocationPreference: false
    };

    // Validate all required fields
    let hasErrors = false;

    if (!isDateAllowed(form.singleDateTime)) {
      newErrors.singleDateTime = true;
      hasErrors = true;
    }

    if (!form.projectConfirmation) {
      newErrors.projectConfirmation = true;
      hasErrors = true;
    }

    if (!form.LongLeavePlans) {
      newErrors.LongLeavePlans = true;
      hasErrors = true;
    }

    if (!form.LocationPreference) {
      newErrors.LocationPreference = true;
      hasErrors = true;
    }

    // Update error states
    setFieldErrors(newErrors);

    // Stop if there are any errors
    if (hasErrors) {
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
      // append new dropdown fields (required)
      formData.append('projectConfirmation', form.projectConfirmation);
      formData.append('LongLeavePlans', form.LongLeavePlans);
      formData.append('LocationPreference', form.LocationPreference);
      formData.append('instructions', form.instructions);
      if (form.cv) {
        formData.append('cv', form.cv);
      }
      if (form.alconScreenshot) {
        formData.append('alconScreenshot', form.alconScreenshot);
      }
      if (form.leavePlanDetails) {
        formData.append('leavePlanDetails', form.leavePlanDetails);
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('Submission response:', data);
      // Optionally show a success message here
    } catch (err) {
      console.log(`Submission failed with error ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, margin: '24px auto', px: 2 }}>
      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="h4" gutterBottom align="center">Availability Form</Typography>
        
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Required Fields Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Required Information</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {loadingDates ? (
                  <TextField 
                    disabled 
                    value="Loading available dates..." 
                    fullWidth 
                    variant="outlined"
                  />
                ) : datesError ? (
                  <TextField 
                    disabled 
                    value={datesError} 
                    fullWidth 
                    error 
                    variant="outlined"
                  />
                ) : (
                  <DateTimePicker
                    label="Select Date & Time"
                    value={form.singleDateTime ? dayjs(Number(form.singleDateTime)) : null}
                    onChange={newValue => {
                      setForm(f => ({ 
                        ...f, 
                        singleDateTime: newValue && newValue.isValid() ? newValue.valueOf() : '' 
                      }));
                      setFieldErrors(prev => ({ ...prev, singleDateTime: false }));
                    }}
                    shouldDisableDate={date => {
                      if (!allowedDays || allowedDays.size === 0) return true;
                      return !allowedDays.has(dayjs(date).format('YYYY-MM-DD'));
                    }}
                    slotProps={{ 
                      textField: { 
                        required: true, 
                        fullWidth: true,
                        error: fieldErrors.singleDateTime,
                        helperText: fieldErrors.singleDateTime ? 'Please select a valid date and time' : '',
                        variant: "outlined"
                      } 
                    }}
                    disablePast
                    ampm={false}
                  />
                )}
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCVChange}
                style={{ display: 'none' }}
                required
              />
              <label htmlFor="cv-upload">
                <Button variant="contained" component="span">Upload CV (PDF/DOC)</Button>
                {form.cv && <Typography component="span" sx={{ ml: 2 }}>{form.cv.name}</Typography>}
              </label>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={1}>
                {form.additionalDateTimes.map((dt, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    {loadingDates ? (
                      <TextField disabled value="Loading..." fullWidth />
                    ) : datesError ? (
                      <TextField disabled value="No dates" fullWidth />
                    ) : allowedDays.size === 0 ? (
                      <TextField disabled value="No available dates from server" fullWidth />
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
                          shouldDisableDate={date => {
                            if (!allowedDays || allowedDays.size === 0) return true;
                            return !allowedDays.has(dayjs(date).format('YYYY-MM-DD'));
                          }}
                          slotProps={{ textField: { fullWidth: true } }}
                          disablePast
                          ampm={false}
                        />
                      </LocalizationProvider>
                    )}
                    <Box sx={{ mt: 1 }}>
                      {form.additionalDateTimes.length > 1 && (
                        <Button size="small" color="error" onClick={() => removeMultiDateTime(idx)}>Remove</Button>
                      )}
                    </Box>
                  </Grid>
                ))}
                <Grid item>
                  <Button onClick={addMultiDateTime}>+ Add Another</Button>
                </Grid>
              </Grid>
            </Grid>


            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                error={fieldErrors.projectConfirmation}
                sx={{ 
                  '& .MuiInputLabel-root': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  },
                  '& .MuiSelect-select': {
                    fontSize: '1.1rem',
                    padding: '14px',
                    backgroundColor: 'white'
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.1rem'
                  }
                }}
              >
                <InputLabel id="project-confirmation-label">Project Confirmation</InputLabel>
                <Select
                  labelId="project-confirmation-label"
                  value={form.projectConfirmation}
                  label="Project Confirmation"
                  onChange={e => {
                    setForm(f => ({ 
                      ...f, 
                      projectConfirmation: e.target.value,
                      alconScreenshot: e.target.value === 'No' ? null : f.alconScreenshot 
                    }));
                    setFieldErrors(prev => ({ ...prev, projectConfirmation: false }));
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        '& .MuiMenuItem-root': {
                          padding: '12px 16px',
                          fontSize: '1.1rem'
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
                <FormHelperText sx={{ fontSize: '0.9rem' }}>
                  {fieldErrors.projectConfirmation ? 'Please select an option' : 'Required'}
                </FormHelperText>
              </FormControl>
            </Grid>

            {form.projectConfirmation === 'Yes' && (
              <Grid item xs={12} md={6}>
                <input
                  id="alcon-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={e => handleFileChange(e, 'alconScreenshot')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="alcon-upload">
                  <Button variant="outlined" component="span">Alocation Screenshot</Button>
                  {form.alconScreenshot && (
                    <Typography component="span" sx={{ ml: 2 }}>
                      {form.alconScreenshot.name}
                    </Typography>
                  )}
                </label>
              </Grid>
            )}

            {/* Leave Plans Section */}

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required
                error={fieldErrors.LongLeavePlans}
                sx={{ 
                  '& .MuiInputLabel-root': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  },
                  '& .MuiSelect-select': {
                    fontSize: '1.1rem',
                    padding: '14px',
                    backgroundColor: 'white'
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.1rem'
                  }
                }}
              >
                <InputLabel id="project-confirmation-label">Long Leave Plans</InputLabel>
                <Select
                  labelId="long-leave-label"
                  value={form.LongLeavePlans}
                  label="Long Leave Plans"
                  onChange={e => {
                    setForm(f => ({ 
                      ...f, 
                      LongLeavePlans: e.target.value,
                      leavePlanDetails: e.target.value === 'No' ? '' : f.leavePlanDetails 
                    }));
                    setFieldErrors(prev => ({ ...prev, LongLeavePlans: false }));
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        '& .MuiMenuItem-root': {
                          padding: '12px 16px',
                          fontSize: '1.1rem'
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
                <FormHelperText sx={{ fontSize: '0.9rem' }}>
                  {fieldErrors.LongLeavePlans ? 'Please select an option' : 'Required'}
                </FormHelperText>
              </FormControl>
            </Grid>

            {form.LongLeavePlans === 'Yes' && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Leave Plan Details"
                  value={form.leavePlanDetails}
                  onChange={e => setForm(f => ({ ...f, leavePlanDetails: e.target.value }))}
                  placeholder="Please provide details about your leave plans"
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            )}

            {/* Location Preference Section */}

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required
                error={fieldErrors.LocationPreference}
                sx={{ 
                  '& .MuiInputLabel-root': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  },
                  '& .MuiSelect-select': {
                    fontSize: '1.1rem',
                    padding: '14px',
                    backgroundColor: 'white'
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.1rem'
                  }
                }}
              >
                <InputLabel id="location-pref-label">Location Preference</InputLabel>
                <Select
                  labelId="location-pref-label"
                  value={form.LocationPreference}
                  label="Location Preference"
                  onChange={e => {
                    setForm(f => ({ ...f, LocationPreference: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, LocationPreference: false }));
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        '& .MuiMenuItem-root': {
                          padding: '12px 16px',
                          fontSize: '1.1rem'
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  <MenuItem value="Bangalore">Bangalore</MenuItem>
                  <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                  <MenuItem value="Chennai(Mcity)">Chennai(Mcity)</MenuItem>
                  <MenuItem value="Pune">Pune</MenuItem>
                  <MenuItem value="Trivandrum">Trivandrum</MenuItem>
                </Select>
                <FormHelperText sx={{ fontSize: '0.9rem' }}>
                  {fieldErrors.LocationPreference ? 'Please select a location' : 'Required'}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Optional instructions"
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Enter instructions (optional)"
                fullWidth
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'right' }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default InitialInput;