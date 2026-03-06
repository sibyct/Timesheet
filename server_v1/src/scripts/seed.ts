/**
 * @file scripts/seed.ts
 * @description Seeds the database with an initial admin and a regular employee
 *              so the app is usable immediately after first setup.
 *
 * Idempotent — running it multiple times is safe; existing records are skipped.
 *
 * Run:
 *   npm run seed
 */

import mongoose from 'mongoose';
import path from 'path';

// ── Load .env before anything else ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
(require('dotenv') as { config: (o: { path: string }) => void }).config({
  path: path.resolve(process.cwd(), '.env'),
});

// ── Import models AFTER env is loaded ─────────────────────────────────────────
import { Department } from '../models/department.model';
import { User }       from '../models/user.model';

// ─── Seed data ────────────────────────────────────────────────────────────────

const DEPARTMENT = {
  name:        'Engineering',
  description: 'Software Engineering department',
  costCenter:  'CC-1001',
};

const ADMIN_USER = {
  firstName:  'System',
  lastName:   'Admin',
  email:      'admin@timesheet.local',
  password:   'Admin@123456',     // changed on first login
  role:       'admin'  as const,
  hourlyRate: 0,
};

const EMPLOYEE_USER = {
  firstName:  'Jane',
  lastName:   'Employee',
  email:      'jane@timesheet.local',
  password:   'Jane@123456',      // changed on first login
  role:       'employee' as const,
  hourlyRate: 85,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

function log(symbol: string, msg: string): void {
  process.stdout.write(`  ${symbol}  ${msg}\n`);
}
function ok(msg: string):   void { log(`${GREEN}✔${RESET}`, msg); }
function skip(msg: string): void { log(`${YELLOW}–${RESET}`, `${DIM}${msg} (already exists, skipped)${RESET}`); }
function section(msg: string): void {
  process.stdout.write(`\n${CYAN}${BOLD}${msg}${RESET}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const mongoUri = process.env['MONGO_URI'];
  if (!mongoUri) {
    process.stderr.write('ERROR: MONGO_URI is not set in your .env file.\n');
    process.exit(1);
  }

  process.stdout.write(`\n${BOLD}Timesheet — Database Seed${RESET}\n`);
  process.stdout.write(`${DIM}Connecting to ${mongoUri.replace(/\/\/.*@/, '//<credentials>@')}…${RESET}\n`);

  await mongoose.connect(mongoUri);
  process.stdout.write(`${GREEN}Connected.${RESET}\n`);

  // ── 1. Department ──────────────────────────────────────────────────────────

  section('Department');

  let dept = await Department.findOne({ name: DEPARTMENT.name });
  if (dept) {
    skip(`Department "${DEPARTMENT.name}"`);
  } else {
    dept = await Department.create(DEPARTMENT);
    ok(`Created department: ${BOLD}${dept.name}${RESET} (${dept._id})`);
  }

  // ── 2. Admin user ──────────────────────────────────────────────────────────

  section('Admin user');

  const existingAdmin = await User.findOne({ email: ADMIN_USER.email });
  if (existingAdmin) {
    skip(`Admin user <${ADMIN_USER.email}>`);
  } else {
    const admin = new User({ ...ADMIN_USER, department: dept._id });
    await admin.save(); // bcrypt pre-save hook hashes the password
    ok(`Created admin: ${BOLD}${admin.firstName} ${admin.lastName}${RESET} <${admin.email}>`);
  }

  // ── 3. Employee user ───────────────────────────────────────────────────────

  section('Employee user');

  const existingEmployee = await User.findOne({ email: EMPLOYEE_USER.email });
  if (existingEmployee) {
    skip(`Employee user <${EMPLOYEE_USER.email}>`);
  } else {
    const employee = new User({ ...EMPLOYEE_USER, department: dept._id });
    await employee.save();
    ok(`Created employee: ${BOLD}${employee.firstName} ${employee.lastName}${RESET} <${employee.email}>`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  process.stdout.write(`
${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗
║               Seed complete — login credentials        ║
╠══════════════════════════════════════════════════════╣
║                                                        ║
║  ADMIN                                                 ║
║  Email   :  admin@timesheet.local                      ║
║  Password:  Admin@123456                               ║
║  Role    :  admin                                      ║
║                                                        ║
║  EMPLOYEE                                              ║
║  Email   :  jane@timesheet.local                       ║
║  Password:  Jane@123456                                ║
║  Role    :  employee                                   ║
║                                                        ║
║  Change passwords after first login!                   ║
╚══════════════════════════════════════════════════════╝${RESET}
`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err: unknown) => {
  process.stderr.write(`\nSeed failed: ${String(err)}\n`);
  mongoose.connection.close().finally(() => process.exit(1));
});
