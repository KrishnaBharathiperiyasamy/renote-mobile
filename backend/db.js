import mongoose from "mongoose";

const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Renote_DB';

// Disable command buffering so disconnected states fail fast instead of hanging requests for 10s
mongoose.set('bufferCommands', false);

const connectDb = async () => {
  try {
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.log('Error connecting to MongoDB:', error.message);
  }
};
export default connectDb;