import axios from "axios";

const apiURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is missing, falling back to localhost:8000.");
}

const api = axios.create({
  baseURL: apiURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || !config.retry) {
      config.retry = 1;
    } else if (config.retry >= 1) {
      return Promise.reject(error);
    }
    
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      config.retry += 1;
      console.warn(`Network timeout/error, retrying request... (${config.retry})`);
      return api(config);
    }
    return Promise.reject(error);
  }
);

export default api;