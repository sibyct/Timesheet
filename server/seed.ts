import mongoose from 'mongoose';
import { config } from './config/index';
import User from './models/user.model';

const ADMIN = {
  username: 'admin',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'User',
  emailAddress: 'admin@timesheet.com',
  role: 0, // 0 = admin
};

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const exists = await User.findOne({ username: ADMIN.username });
  if (exists) {
    console.log(`Admin user "${ADMIN.username}" already exists. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  await User.create(ADMIN);
  console.log(`Admin user created → username: "${ADMIN.username}" | password: "${ADMIN.password}"`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
