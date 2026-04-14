import axios from "axios"`nconst baseURL = import.meta.env.VITE_API_BASE || "http://localhost:3001"`nexport const api = axios.create({ baseURL })`n
