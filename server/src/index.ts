import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from './routes/auth';
import courseRoutes from './routes/course';
import teacherRoutes from './routes/teacher';
import reviewRoutes from './routes/review';
import commentRoutes from './routes/comment';
import courseReviewRoutes from './routes/courseReview';
import photoRoutes from './routes/photo';
import aiRoutes from './routes/ai';
import enrollRoutes from './routes/enroll';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import User from './models/User';
import { seedDemoData } from './seedData';

dotenv.config();

const app = express();
const PORT = 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course_helper';
const EMBEDDED_DB = String(process.env.EMBEDDED_DB || '').toLowerCase() === 'true';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/course-reviews', courseReviewRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

async function startServer() {
  try {
    let uri = MONGODB_URI;
    if (EMBEDDED_DB) {
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri('course_helper_offline');
      console.log('Embedded MongoDB started');
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    if (EMBEDDED_DB) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('Embedded DB is empty, seeding demo data...');
        await seedDemoData({ clearFirst: false });
        console.log('Demo data ready.');
      }
    }
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

startServer();
