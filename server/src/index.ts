import express from "express";
import cors from "cors";
import fileRoutes from "./routes/file.routes";
import authRoutes from "./routes/auth.routes";
import shareRoutes from "./routes/share.routes";
import { supabase } from "./config/supabase";
import path from "path";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test Supabase connection
const testConnection = async () => {
  try {
    await supabase.from('files').select('count', { count: 'exact' });
    console.log('Connected to Supabase successfully');
    const { data: { user } } = await supabase.auth.getUser()
console.log(user)

  } catch (error: any) {
    console.error('Error connecting to Supabase:', error);
  }
};

testConnection();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/files", shareRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});