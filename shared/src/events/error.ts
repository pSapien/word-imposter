export interface ErrorResponse {
  type: "error";
  payload: {
    code: string;
    message: string;
  };
}
