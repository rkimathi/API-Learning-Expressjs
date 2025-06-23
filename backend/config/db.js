const mongoose = require('mongoose');

// TODO: Move MONGO_URI to environment variables (e.g., .env file)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern_api_db_dev';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
      // useCreateIndex is also no longer needed
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
