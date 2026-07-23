import axios from "axios";
import { API_BASE_URL } from "./endpoints";
import { auth } from "@/Config/firebase";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// The API's AuthMiddleware verifies a Firebase ID token on every route, and
// those tokens expire after an hour. Reading it per-request via getIdToken()
// lets the SDK hand back a refreshed one instead of us caching a stale copy.
axiosInstance.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
