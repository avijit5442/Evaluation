import express from 'express';
import testRouter from './routes/test.js';
import dateRouter from './routes/dateToSelect.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// static uploads
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
// body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// routes
app.use(testRouter);
app.use(dateRouter);
const port = 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
