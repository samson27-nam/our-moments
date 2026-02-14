
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.ts';
import photoRoutes from './routes/photos.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Fixed: Cast express.json() to any to resolve RequestHandler type mismatch in app.use overloads
app.use(express.json() as any);

// DB Connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('Connected to MongoDB 💖'))
  .catch(err => console.error('DB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
