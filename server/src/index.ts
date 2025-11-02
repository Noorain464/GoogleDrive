import express from "express";
import cors from "cors";
import fileRoutes from "./routes/file.routes";
import { supabase } from "./config/supabase";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Test Supabase connection
const testConnection = async () => {
  try {
    await supabase.from('files').select('count', { count: 'exact' });
    console.log('Connected to Supabase successfully');
  } catch (error: any) {
    console.error('Error connecting to Supabase:', error);
  }
};

testConnection();

// Routes
app.use("/api/files", fileRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});