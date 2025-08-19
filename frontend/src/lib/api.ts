import axios from "axios";

// Create a configured Axios instance pointing at the backend API.
// The base URL can be overridden by setting NEXT_PUBLIC_API_URL in the
// environment. If no environment variable is provided it falls back to
// localhost during development.

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 30000,
});
