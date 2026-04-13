export type Result<T, E> = {
  status: "ok";
  data: T
} | {
  status: "error";
  error: E
};

export const ok = <T>(data: T): Result<T, any> => ({ status: "ok", data });
export const error = <E>(error: E): Result<any, E> => ({ status: "error", error });
