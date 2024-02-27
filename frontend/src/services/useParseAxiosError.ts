import { AxiosError } from "axios";

export default function parseAxiosError(error: AxiosError): string {
  let message = "";
  const errorBody = error.response?.data as any;
  if (errorBody) {
    if (errorBody?.errors)
      for (const [index, err] of errorBody.errors.entries()) {
        if (error.response?.statusText === "Unprocessable Entity" && err.message?.measge) {
          message += `${index + 1}. ${err.message.message} `;
        } else message += `${index + 1}. ${err.message} `;
      }
    else if (errorBody.message) message = errorBody.message;
    else message = error.message;
    return message;
  } else return message;
}