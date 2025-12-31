import axios from "axios";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../utils/constants";




const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("authToken");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers.Authorization ? "Bearer token present" : "No token",
      data: config.data,
    });

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error('401 Unauthorized on:', originalRequest.method?.toUpperCase(), originalRequest.url);
      console.error('401 Response:', error.response.data);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {

        console.log('Cookies before refresh:', document.cookie);
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log("REFRESH TOKEN RESPONSE", res);


        const newToken = res.data?.data?.accessToken;
        if (!newToken) {
          throw new Error("Refresh token response missing accessToken");
        }

        localStorage.setItem("authToken", newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        console.log("NEW TOKEN", newToken);
        console.log("ORIGINAL REQUEST", originalRequest);

        return axiosInstance(originalRequest);
      } catch (err) {
        console.error("Refresh token failed:", err);
        return Promise.reject(err);
      }
    } else if (error.response?.status === 403) {
      const isLoginRequest = originalRequest.url?.includes('/login');

      console.error('403 Forbidden on:', originalRequest.method?.toUpperCase(), originalRequest.url);
      console.error('403 Response:', error.response.data);

      if (!isLoginRequest) {

        console.error('403: Would redirect to login, but suppressed for debugging');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
