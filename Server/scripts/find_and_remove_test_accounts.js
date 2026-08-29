#!/usr/bin/env node
/*
Safe script to find and optionally delete test/fake student accounts.

Usage:
  # Dry run (list candidates):
  node scripts/find_and_remove_test_accounts.js

  # Delete flagged accounts (CAREFUL - use only after review):
  node scripts/find_and_remove_test_accounts.js --delete

Environment:
  Ensure `MONGODB_URI` is set in environment or in Server/.env accessible via dotenv.

Selection heuristics (configurable below):
  - `isTestAccount: true`
  - email contains `test`, `example.com`, `fake`, `temp` (case-insensitive)
  - name contains `test` or `dummy`

The script prints a summary and, if `--delete` is provided, will delete matched accounts after prompting for confirmation.
*/

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import readline from 'readline';
import Student from '../models/Student.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sajha-dev';

const emailPatterns = ['test', 'example.com', 'fake', 'temp', 'dummy'];
const namePatterns = ['test', 'dummy'];

const buildQuery = () => {
  const emailRegex = new RegExp(emailPatterns.join('|'), 'i');
  const nameRegex = new RegExp(namePatterns.join('|'), 'i');

  return {
    $or: [
      { isTestAccount: true },
      { email: { $regex: emailRegex } },
      { name: { $regex: nameRegex } },
    ],
  };
};

const prompt = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (ans) => { rl.close(); resolve(ans); });
});

const run = async () => {
  console.log('Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const query = buildQuery();
  const candidates = await Student.find(query).select('email name studentId createdAt isTestAccount phone').lean().exec();

  if (!candidates.length) {
    console.log('No candidate test/fake accounts found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${candidates.length} candidate accounts:`);
  candidates.forEach((c, i) => {
    console.log(`${i + 1}. ${c.email} | ${c.name || '-'} | ${c.studentId || '-'} | isTest:${!!c.isTestAccount} | phone:${c.phone || '-'} | created:${c.createdAt}`);
  });

  const shouldDelete = process.argv.includes('--delete');

  if (!shouldDelete) {
    console.log('\nDry run complete. To delete these accounts, re-run with --delete flag.');
    await mongoose.disconnect();
    return;
  }

  const ans = await prompt('DELETE these accounts from DB? Type YES to confirm: ');
  if (ans !== 'YES') {
    console.log('Aborting deletion. No changes made.');
    await mongoose.disconnect();
    return;
  }

  const ids = candidates.map((c) => c._id);
  const res = await Student.deleteMany({ _id: { $in: ids } });
  console.log(`Deleted ${res.deletedCount} accounts.`);
  await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });
