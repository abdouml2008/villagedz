import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: Log environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Environment:', import.meta.env);

createRoot(document.getElementById("root")!).render(<App />);
