
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const SUBMISSIONS_DIR = path.resolve(process.cwd(), 'submissions');

// ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SUBMISSIONS_DIR)) fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });

// store files with original extension and a safe unique name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

const router = Router();

// Example list of holidays (YYYY-MM-DD format)
const holidays = [
  '2025-01-01', // New Year's Day
  '2025-12-25',
  '2025-10-20',
  '2025-08-27' // Christmas
  // Add more holidays as needed
];

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}

router.get('/dates', (req, res) => {
  const dates = [];
  let current = new Date();
  while (dates.length < 100) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current) && !isHoliday(current)) {
      dates.push(current.toISOString().split('T')[0]);
    }
  }
  res.json({ dates });
});

router.post(
  '/submit',
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'alconScreenshot', maxCount: 1 },
  ]),
  (req, res) => {
    const {
      Name,
      EmpId,
      Email,
      DateTime,
      optionalDateTimes,
      instructions,
      projectConfirmation,
      LongLeavePlans,
      leavePlanDetails,
      LocationPreference,
    } = req.body;

    const cv = req.files?.cv?.[0];
    const alconScreenshot = req.files?.alconScreenshot?.[0]; // ✅ optional
console.log("submission body:", req.body,req.files);
    if (!DateTime || !cv) {
      return res.status(400).json({ error: 'DateTime and CV file are required.' });
    }

    const ext = path.extname(cv.originalname) || '';
    const sanitize = (s) =>
      (s || '').toString().replace(/[\\/:*?"<>|]+/g, '-').trim();
    const baseName = `${sanitize(Name)}-${sanitize(EmpId)}-${sanitize(Email)}`.replace(/\s+/g, '-');
    let finalName = `${baseName}${ext}`;
    let targetPath = path.join(UPLOADS_DIR, finalName);
    let counter = 1;

    while (fs.existsSync(targetPath)) {
      finalName = `${baseName}-${counter}${ext}`;
      targetPath = path.join(UPLOADS_DIR, finalName);
      counter += 1;
    }

    try {
      fs.renameSync(cv.path, targetPath);
    } catch (err) {
      console.error('Failed to move uploaded file:', err);
      return res.status(500).json({ error: 'Failed to save uploaded file' });
    }

    const submissionId = uuidv4();

    const submission = {
      id: submissionId,
      Name,
      EmpId,
      Email,
      DateTime,
      optionalDateTimes: optionalDateTimes || null,
      projectConfirmation,
      LongLeavePlans,
      leavePlanDetails,
      LocationPreference,
      instructions: instructions || null,
      Cvfile: {
        originalName: cv.originalname,
        mimeType: cv.mimetype,
        size: cv.size,
        savedName: finalName,
        path: path.relative(process.cwd(), targetPath).replace(/\\/g, '/'),
      },
      // ✅ optional field — only add if uploaded
      alocationFile: alconScreenshot
        ? {
            originalName: alconScreenshot.originalname,
            mimeType: alconScreenshot.mimetype,
            size: alconScreenshot.size,
            savedName: alconScreenshot.filename || alconScreenshot.originalname,
            path: path.relative(process.cwd(), alconScreenshot.path).replace(/\\/g, '/'),
          }
        : null,
      createdAt: new Date().toISOString(),
    };

    const submissionsFile = path.join(SUBMISSIONS_DIR, 'submissions.json');

    try {
      let list = [];
      if (fs.existsSync(submissionsFile)) {
        const raw = fs.readFileSync(submissionsFile, 'utf8');
        list = raw.trim() ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
      }

      list.push(submission);

      const tmpFile = submissionsFile + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tmpFile, submissionsFile);
    } catch (err) {
      console.error('Failed to append submission:', err);
      return res.status(500).json({ error: 'Failed to save submission' });
    }

    res.json({ message: 'Submission received!', submission });
  }
);


router.get('/submissions', (req, res) => {
  const includeFile = req.query.includeFile === 'true';
  const submissionsFile = path.join(SUBMISSIONS_DIR, 'submissions.json');
  if (!fs.existsSync(submissionsFile)) return res.json([]);

  try {
    const raw = fs.readFileSync(submissionsFile, 'utf8');
    const list = raw.trim() ? JSON.parse(raw) : [];

    if (!includeFile) return res.json(list);

    // include base64 content for each file (if exists)
    const enhanced = list.map(item => {
      const filePath = item.file && item.file.path ? path.join(process.cwd(), item.file.path) : null;
      if (filePath && fs.existsSync(filePath)) {
        try {
          const buf = fs.readFileSync(filePath);
          const base64 = buf.toString('base64');
          return { ...item, file: { ...item.file, contentBase64: base64 } };
        } catch (e) {
          return { ...item, file: { ...item.file, contentError: 'failed to read file' } };
        }
      }
      return item;
    });

    return res.json(enhanced);
  } catch (err) {
    console.error('Failed to read submissions:', err);
    return res.status(500).json({ error: 'Failed to read submissions' });
  }
});

// Stream/download the file for a specific submission id
router.get('/submissions/:id/file', (req, res) => {
  const id = req.params.id;
  const submissionsFile = path.join(SUBMISSIONS_DIR, 'submissions.json');
  if (!fs.existsSync(submissionsFile)) return res.status(404).json({ error: 'No submissions found' });

  try {
    const raw = fs.readFileSync(submissionsFile, 'utf8');
    const list = raw.trim() ? JSON.parse(raw) : [];
    const item = list.find(s => s.id === id);
    if (!item) return res.status(404).json({ error: 'Submission not found' });

    const filePath = item.file && item.file.path ? path.join(process.cwd(), item.file.path) : null;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Uploaded file not found' });

    res.setHeader('Content-Type', item.file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${item.file.originalName || item.file.savedName}"`);
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => {
      console.error('Stream error:', err);
      res.status(500).end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error('Failed to stream file:', err);
    return res.status(500).json({ error: 'Failed to stream file' });
  }
});

// POST feedback: attach feedback to existing submission by EmpId (latest one)
router.post('/feedback', (req, res) => {
  const body = req.body || {};
  const empId = body.EmpId || body.empId || body.empid || '';
  const expected = ['workMode','Location','projectConfirmation','leavePlans','experience','skill','communication','technicalKnowledge','status','feedback','additionalFeedback'];
  const fb = {};
  expected.forEach(k => fb[k] = body[k] || '');
  fb.feedbackAt = new Date().toISOString();

  if (!empId) return res.status(400).json({ error: 'EmpId is required' });

  const submissionsFile = path.join(SUBMISSIONS_DIR, 'submissions.json');
  if (!fs.existsSync(submissionsFile)) return res.status(404).json({ error: 'No submissions found' });

  try {
    const raw = fs.readFileSync(submissionsFile, 'utf8');
    const list = raw.trim() ? JSON.parse(raw) : [];

    // find submissions for this EmpId
    const matches = list.filter(s => s.EmpId && s.EmpId.toString() === empId.toString());
    if (!matches.length) return res.status(404).json({ error: 'Submission with provided EmpId not found' });

    // choose the latest submission by createdAt (fallback to last in array)
    matches.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
    const target = matches[matches.length - 1];

    const idx = list.findIndex(s => s.id === target.id);
    if (idx === -1) return res.status(500).json({ error: 'Internal error locating submission' });

    // attach feedback object to the submission
    list[idx].feedback = fb;

    // write back atomically
    const tmp = submissionsFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf8');
    fs.renameSync(tmp, submissionsFile);

    return res.json({ message: 'Feedback attached to submission', submission: list[idx] });
  } catch (err) {
    console.error('Failed to attach feedback:', err);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
});
router.post('/send-result', (req, res) => {
  const { EmpId, Result } = req.body || {};

  if (!EmpId) {
    return res.status(400).json({ error: 'EmpId is required' });
  }

  const resultsFile = path.join(SUBMISSIONS_DIR, 'final-Result.json');

  try {
    let results = [];

    // ✅ Read existing file if it exists
    if (fs.existsSync(resultsFile)) {
      const rawData = fs.readFileSync(resultsFile, 'utf8');
      results = rawData.trim() ? JSON.parse(rawData) : [];
      if (!Array.isArray(results)) results = [];
    }

    // ✅ Create new result entry
    const newResult = {
      EmpId,
      Result,
      updatedAt: new Date().toLocaleString()
    };

    // ✅ Append the new one
    results.push(newResult);

    // ✅ Write safely via temp file (prevents corruption)
    const tmpFile = resultsFile + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(results, null, 2), 'utf8');
    fs.renameSync(tmpFile, resultsFile);

    // ✅ Respond success
    res.json({ message: 'Result saved successfully', newResult });
  } catch (err) {
    console.error('Failed to attach finalResult :', err);
    return res.status(500).json({ error: 'Failed to save finalResult' });
  }
});




export default router;
