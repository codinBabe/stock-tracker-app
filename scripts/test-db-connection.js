#!/usr/bin/env node
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set.');
  console.error('Set it and re-run the script. Example (PowerShell):');
  console.error('  $env:MONGODB_URI = "your-mongodb-uri"; node scripts\\test-db-connection.js');
  process.exit(2);
}

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    // use same option used in project file
    await mongoose.connect(MONGODB_URI, { bufferCommands: false, connectTimeoutMS: 10000 });
    console.log('✅ Successfully connected to MongoDB');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:');
    // show useful bits of the error
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
})();
