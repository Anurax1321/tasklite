import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import tasksRouter from './routes/tasks';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';
import importRouter from './routes/import';

const PORT = Number(process.env.PORT) || 5291;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5292';

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/import', importRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`tasklite backend listening on http://localhost:${PORT}`);
});
