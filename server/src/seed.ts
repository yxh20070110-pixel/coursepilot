import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDemoData } from './seedData';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_helper');
  await seedDemoData({ clearFirst: true });

  console.log('Seed data created!');
  console.log('Admin: admin@university.edu / admin123');
  console.log('User:  zhangsan@university.edu / 123456');
  await mongoose.disconnect();
}

seed().catch(console.error);
