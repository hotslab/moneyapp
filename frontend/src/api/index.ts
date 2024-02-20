import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import router from "../router";

let axiosApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

axiosApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authUser: { user: any; token: string } = JSON.parse(
      sessionStorage.getItem("authUser") as string
    );
    if (authUser) config.headers.Authorization = `Bearer ${authUser.token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.data) {
      console.error("[Axios Error]", error.response);
      checkIfUnauthorised(error.response.data);
    } else {
      console.error("Unknown error", error);
    }
    return Promise.reject(error);
  }
);

function checkIfUnauthorised(errorData: any) {
  const authErrors = [
    "Unauthorized access",
    "Unauthorized - email not verified",
  ];
  if (errorData?.message && authErrors.includes(errorData.message)) {
    return logOutUnauthorizedUser(errorData.message);
  } else if (errorData?.errors) {
    for (const error of errorData.errors) {
      if (authErrors.includes(error.message)) {
        return logOutUnauthorizedUser(error.message);
      }
    }
  }
}

function logOutUnauthorizedUser(errorMessage: string) {
  router.navigate("/login", {
    state: {
      errorMessage: `${errorMessage}. Please login or verify to access it properly`,
    },
  });
}

export default axiosApi;
