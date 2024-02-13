import axios, {
  AxiosError,
  AxiosResponse,
  AxiosStatic,
  InternalAxiosRequestConfig,
} from "axios";
import router from "../router";

let axiosApi = axios.create({
  baseURL: `http://localhost:3333`,
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
    if (error.response && error.response.data) {
      console.error("[Axios Error]", error.response);
      checkIfUnauthorised(error.response.data);
    } else {
      console.error("Unknown error", error);
    }
    return Promise.reject(error);
  }
);

function checkIfUnauthorised(errorData: any) {
  if (errorData?.errors) {
    const authErrors = [
      "Authentication Error",
      "Authentication error",
      "Unauthorized access",
      "jwt expired",
      "Unauthorized",
    ];
    for (const error of errorData.errors) {
      if (authErrors.includes(error.message)) {
        sessionStorage.removeItem("authUser");
        router.navigate("/login", {
          state: {
            errorMessage:
              "You are unauthorized to view this page. Please login to access it properly",
          },
        });
        return;
      }
    }
  }
}

export default axiosApi;
