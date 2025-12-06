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
import NotificationPanel from './Utils/Notification';

function InitialInput() {
  const [fieldErrors, setFieldErrors] = useState({
    EmpId: false,
    Name: false,
    singleDateTime: false,
    projectConfirmation: false,
    LongLeavePlans: false,
    LocationPreference: false
  });

  const [form, setForm] = useState({
    EmpId: null,
    Name: null,
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
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [datesError, setDatesError] = useState(null);

  const allowedDays = useMemo(() => {
    if (!availableDates || availableDates.length === 0) return new Set();
    return new Set(availableDates.map(d => dayjs(d).format('YYYY-MM-DD')));
  }, [availableDates]);

  // Shared box style for consistent sizing across sections
  const itemBoxSx = {
    minWidth: '220px',
    flex: '0 0 220px',
    maxWidth: '220px',
    minHeight: 72,
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    margin: '0px'
    ,
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

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

  function isDateAllowed(val) {
    if (!allowedDays || allowedDays.size === 0) return false;
    if (!val && val !== 0) return false;
    const d = dayjs(Number(val));
    if (!d || !d.isValid()) return false;
    return allowedDays.has(d.format('YYYY-MM-DD'));
  }

  const handleNotificationClose = () => setNotification(n => ({ ...n, open: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      EmpId: false,
      Name: false,
      singleDateTime: false,
      projectConfirmation: false,
      LongLeavePlans: false,
      LocationPreference: false
    };

    let hasErrors = false;

    if (!form.EmpId || form.EmpId.trim() === '') {
      newErrors.EmpId = true;
      hasErrors = true;
    }

    if (!form.Name || form.Name.trim() === '') {
      newErrors.Name = true;
      hasErrors = true;
    }

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

    setFieldErrors(newErrors);

    if (hasErrors) {
      setNotification({
        open: true,
        message: 'Please fill all required fields correctly',
        severity: 'error',
      });
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
      optionalIsos.forEach(dt => formData.append('optionalDateTimes[]', dt));
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
      setNotification({
        open: true,
        message: `${data.message} for EmpId - ${data.submission?.EmpId ?? form.EmpId}`,
        severity: 'success',
      });
    } catch (err) {
      console.log(`Submission failed with error ${err}`);
      setNotification({
        open: true,
        message: 'Something went wrong, please try again',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <Box sx={{ maxWidth: 1200, margin: '0 auto', px: { xs: 2, md: 3 } }}>
        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            align="center"
            sx={{ 
              mb: 4, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Employee Availability Form
          </Typography>
          
          <form onSubmit={handleSubmit} noValidate>
            <Grid container spacing={4}>
              {/* Section 1: Employee Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  {/* Section Header */}
                  <Box sx={{ flex: '0 0 260px', pt: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#667eea',
                        fontSize: '1.1rem',
                        display: 'flex', 
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#667eea', mr: 1.5 }} />
                      Employee <br /> Information
                    </Typography>
                  </Box>

                  {/* Section Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                      <Box sx={{ ...itemBoxSx}}>
                        <TextField
                          label="Name"
                          value={form.Name || ''}
                          onChange={e => {
                            setForm(f => ({ ...f, Name: e.target.value }));
                            setFieldErrors(prev => ({ ...prev, Name: false }));
                          }}
                          fullWidth
                          required
                          error={fieldErrors.Name}
                          helperText={fieldErrors.Name ? 'Name is required' : ''}
                          variant="outlined"
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              height: 56,
                              fontSize: '1rem'
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ ...itemBoxSx}}>
                        <TextField
                          label="Emp ID"
                          value={form.EmpId || ''}
                          onChange={e => {
                            setForm(f => ({ ...f, EmpId: e.target.value }));
                            setFieldErrors(prev => ({ ...prev, EmpId: false }));
                          }}
                          fullWidth
                          required
                          error={fieldErrors.EmpId}
                          helperText={fieldErrors.EmpId ? 'Emp ID is required' : ''}
                          variant="outlined"
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              height: 56,
                              fontSize: '1rem'
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ ...itemBoxSx, p: 1, border: '1px solid #e6eefc', borderRadius: 1, backgroundColor: '#ffffff', flexDirection: 'column', justifyContent: 'center' }}>
                        <input
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCVChange}
                          style={{ display: 'none' }}
                          required
                        />
                        <label htmlFor="cv-upload" style={{ width: '100%', cursor: 'pointer' }}>
                          <Button 
                            variant="outlined" 
                            component="span"
                            size="small"
                            sx={{
                              color: '#3b4bb5',
                              fontWeight: 600,
                              py: 0.6,
                              px: 2,
                              fontSize: '0.85rem',
                              textTransform: 'none'
                            }}
                          >
                            📄 Upload CV
                          </Button>
                        </label>
                        {form.cv && (
                          <Typography variant="caption" sx={{ mt: 1, color: '#6b7bd6', fontWeight: 600, textAlign: 'center', fontSize: '0.75rem' }}>
                            ✓ {form.cv.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>

                {/* Section 2: Availability Slots */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    {/* Section Header */}
                    <Box sx={{ flex: '0 0 260px', pt: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#667eea',
                          fontSize: '1.1rem',
                          display: 'flex', 
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#667eea', mr: 1.5 }} />
                        Availability <br /> Slots
                      </Typography>
                    </Box>

                    {/* Section Content */}
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        {/* Primary Slot */}
                        <Box sx={{ ...itemBoxSx}}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            {loadingDates ? (
                              <TextField 
                                disabled 
                                value="Loading..." 
                                fullWidth 
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }}
                              />
                            ) : datesError ? (
                              <TextField 
                                disabled 
                                value={datesError} 
                                fullWidth 
                                error 
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }}
                              />
                            ) : (
                              <DateTimePicker
                                label="Primary Slot"
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
                                    helperText: fieldErrors.singleDateTime ? 'Required' : '',
                                    variant: "outlined",
                                    sx: { '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }
                                  } 
                                }}
                                disablePast
                                ampm={false}
                              />
                            )}
                          </LocalizationProvider>
                        </Box>

                        {/* Slot 2 (First Additional Slot) */}
                        {form.additionalDateTimes.length > 0 && (
                          <Box sx={{ ...itemBoxSx }} key="slot2">
                            {loadingDates ? (
                              <TextField disabled value="Loading..." fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }} />
                            ) : datesError ? (
                              <TextField disabled value="No dates" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }} />
                            ) : allowedDays.size === 0 ? (
                              <TextField disabled value="No dates" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }} />
                            ) : (
                              <Box>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                  <DateTimePicker
                                    label={`Slot 2`}
                                    value={form.additionalDateTimes[0] ? (dayjs(Number(form.additionalDateTimes[0])).isValid() ? dayjs(Number(form.additionalDateTimes[0])) : null) : null}
                                    onChange={newValue => setForm(f => {
                                      const next = [...f.additionalDateTimes];
                                      next[0] = newValue && newValue.isValid() ? newValue.valueOf() : '';
                                      return { ...f, additionalDateTimes: next };
                                    })}
                                    shouldDisableDate={date => {
                                      if (!allowedDays || allowedDays.size === 0) return true;
                                      return !allowedDays.has(dayjs(date).format('YYYY-MM-DD'));
                                    }}
                                    slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } } } }}
                                    disablePast
                                    ampm={false}
                                  />
                                </LocalizationProvider>
                                {form.additionalDateTimes.length > 1 && (
                                  <Button 
                                    size="small" 
                                    color="error" 
                                    onClick={() => removeMultiDateTime(0)}
                                    fullWidth
                                    sx={{ mt: 1, fontSize: '0.8rem' }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Add Another Button */}
                        <Box sx={{ ...itemBoxSx, p: 1, border: '1px solid #e6eefc', borderRadius: 1, backgroundColor: '#ffffff', flexDirection: 'column', justifyContent: 'center' }}>
                          <Button
                            onClick={addMultiDateTime}
                            variant="outlined"
                            size="small"
                            sx={{
                              color: '#475569',
                              fontWeight: 600,
                              py: 0.6,
                              px: 2,
                              fontSize: '0.85rem',
                              textTransform: 'none'
                            }}
                          >
                            ➕ Add another
                          </Button>
                        </Box>


                        {/* Additional Slots (Slot 3+) */}
                        {form.additionalDateTimes.map((dt, idx) => 
                          idx > 0 && (
                            <Box sx={{ ...itemBoxSx }} key={idx}>
                              {loadingDates ? (
                                <TextField disabled value="Loading..." fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }} />
                              ) : datesError ? (
                                <TextField disabled value="No dates" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }} />
                              ) : allowedDays.size === 0 ? (
                                <TextField disabled value="No dates" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }} />
                              ) : (
                                <Box>
                                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker
                                      label={`Slot ${idx + 2}`}
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
                                      slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } } } }}
                                      disablePast
                                      ampm={false}
                                    />
                                  </LocalizationProvider>
                                  {form.additionalDateTimes.length > 1 && (
                                    <Button 
                                      size="small" 
                                      color="error" 
                                      onClick={() => removeMultiDateTime(idx)}
                                      fullWidth
                                      sx={{ mt: 1, fontSize: '0.8rem' }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Box>
                          )
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Section 3: Preferences & Plans */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    {/* Section Header */}
                    <Box sx={{ flex: '0 0 260px', pt: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#667eea',
                          fontSize: '1.1rem',
                          display: 'flex', 
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#667eea', mr: 1.5 }} />
                        Preferences <br /> & Plans
                      </Typography>
                    </Box>

                    {/* Section Content */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'nowrap' }}>
                        {/* Project Confirmation */}
                        <Box sx={{ ...itemBoxSx, minWidth: '220px', flex: '0 1 auto', flexDirection: 'column', alignItems: 'stretch' }}>
                          <FormControl 
                            fullWidth 
                            required 
                            error={fieldErrors.projectConfirmation}
                            sx={{ 
                              '& .MuiInputLabel-root': {
                                fontSize: '0.95rem',
                                fontWeight: 500
                              },
                              '& .MuiSelect-select': {
                                fontSize: '1rem',
                                py: 2,
                                backgroundColor: 'white'
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
                            >
                              <MenuItem value=""><em>Select</em></MenuItem>
                              <MenuItem value="Yes">Yes</MenuItem>
                              <MenuItem value="No">No</MenuItem>
                            </Select>
                            <FormHelperText sx={{ fontSize: '0.85rem' }}>
                              {fieldErrors.projectConfirmation ? 'Required' : 'Required'}
                            </FormHelperText>
                          </FormControl>
                        </Box>

                        {/* Location Preference */}
                        <Box sx={{ ...itemBoxSx, minWidth: '220px', flex: '0 1 auto', flexDirection: 'column', alignItems: 'stretch' }}>
                          <FormControl 
                            fullWidth 
                            required
                            error={fieldErrors.LocationPreference}
                            sx={{ 
                              '& .MuiInputLabel-root': {
                                fontSize: '0.95rem',
                                fontWeight: 500
                              },
                              '& .MuiSelect-select': {
                                fontSize: '1rem',
                                py: 2,
                                backgroundColor: 'white'
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
                            >
                              <MenuItem value=""><em>Select</em></MenuItem>
                              <MenuItem value="Bangalore">Bangalore</MenuItem>
                              <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                              <MenuItem value="Chennai(Mcity)">Chennai(Mcity)</MenuItem>
                              <MenuItem value="Pune">Pune</MenuItem>
                              <MenuItem value="Trivandrum">Trivandrum</MenuItem>
                            </Select>
                            <FormHelperText sx={{ fontSize: '0.85rem' }}>
                              {fieldErrors.LocationPreference ? 'Required' : 'Required'}
                            </FormHelperText>
                          </FormControl>
                        </Box>

                        {/* Long Leave Plans */}
                        <Box sx={{ ...itemBoxSx, minWidth: '220px', flex: '0 1 auto', flexDirection: 'column', alignItems: 'stretch' }}>
                          <FormControl 
                            fullWidth 
                            required
                            error={fieldErrors.LongLeavePlans}
                            sx={{ 
                              '& .MuiInputLabel-root': {
                                fontSize: '0.95rem',
                                fontWeight: 500
                              },
                              '& .MuiSelect-select': {
                                fontSize: '1rem',
                                py: 2,
                                backgroundColor: 'white'
                              }
                            }}
                          >
                            <InputLabel id="long-leave-label">Long Leave Plans</InputLabel>
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
                            >
                              <MenuItem value=""><em>Select</em></MenuItem>
                              <MenuItem value="Yes">Yes</MenuItem>
                              <MenuItem value="No">No</MenuItem>
                            </Select>
                            <FormHelperText sx={{ fontSize: '0.85rem' }}>
                              {fieldErrors.LongLeavePlans ? 'Required' : 'Required'}
                            </FormHelperText>
                          </FormControl>
                        </Box>
                      </Box>

                      {/* Screenshot Upload (appears below if Project Confirmation = Yes) */}
                      {form.projectConfirmation === 'Yes' && (
                        <Box sx={{ mt: 2, ...itemBoxSx, p: 2, border: '2px solid #ffc107', borderRadius: 1, backgroundColor: '#fffbf0', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            id="alcon-upload"
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            onChange={e => handleFileChange(e, 'alconScreenshot')}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="alcon-upload" style={{ width: '100%', cursor: 'pointer' }}>
                            <Button 
                              variant="contained" 
                              component="span"
                              fullWidth
                              sx={{
                                backgroundColor: '#ffc107',
                                color: '#333',
                                fontWeight: 600,
                                py: 1.5,
                                fontSize: '0.9rem',
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: '#ff9800',
                                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)'
                                }
                              }}
                            >
                              📸 Upload Screenshot
                            </Button>
                          </label>
                          {form.alconScreenshot && (
                            <Typography 
                              variant="caption" 
                              sx={{ mt: 1, color: '#ff9800', fontWeight: 600, textAlign: 'center', fontSize: '0.75rem' }}
                            >
                              ✓ {form.alconScreenshot.name}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Leave Plan Details (appears below if Long Leave Plans = Yes) */}
                      {form.LongLeavePlans === 'Yes' && (
                        <Box sx={{ mt: 2, ...itemBoxSx, flexDirection: 'column', alignItems: 'stretch' }}>
                          <TextField
                            label="Leave Plan Details"
                            value={form.leavePlanDetails}
                            onChange={e => setForm(f => ({ ...f, leavePlanDetails: e.target.value }))}
                            placeholder="Provide details"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            sx={{ backgroundColor: '#f9f9f9' }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>


                {/* Section 4: Additional Notes */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    {/* Section Header */}
                    <Box sx={{ flex: '0 0 260px', pt: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#667eea',
                          fontSize: '1.1rem',
                          display: 'flex', 
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#667eea', mr: 1.5 }} />
                        Additional <br /> Notes
                      </Typography>
                    </Box>

                    {/* Section Content */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ ...itemBoxSx, flexDirection: 'column', alignItems: 'stretch' }}>
                        <TextField
                          label="Optional Instructions"
                          value={form.instructions}
                          onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                          placeholder="Enter any additional instructions or notes (optional)"
                          fullWidth
                          variant="outlined"
                          sx={{ backgroundColor: '#f9f9f9', '& .MuiOutlinedInput-root': { height: 56, boxSizing: 'border-box' } }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Submit Button - Separate Row */}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Button 
                    type="submit" 
                    size='small'
                    variant="contained" 
                    disabled={submitting}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700,
                      py: 0.8,
                      px: 3,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      borderRadius: 2,
                      minWidth: '110px',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 6px 20px linear-gradient(135deg, #667eea 0%, #764ba2 100%))'
                      },
                      '&:disabled': {
                        background: '#ccc',
                        color: '#666'
                      }
                    }}
                  >
                    {submitting ? 'Submitting...' : '✓ Submit'}
                  </Button>
                </Grid>
            </Grid>
          </form>
        </Paper>
        <NotificationPanel
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={handleNotificationClose}
        />
      </Box>
  );
}

export default InitialInput;
