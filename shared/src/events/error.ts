export interface ErrroResponse {
  type: "error";
  payload: {
    code: string;
    message: string;
  };
}
