// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express(); // <--- BẠN ĐÃ QUÊN DÒNG NÀY
app.use(express.json());

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT || 3000}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
};

startServer();
