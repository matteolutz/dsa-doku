import { TRPC_ERROR_CODE_KEY, TRPCError } from "@trpc/server";
import { FMError } from ".";

export const toTRPCError = async <T>(result: Promise<T>): Promise<T> => result.catch((e) => {
  // trpc will automatically convert this to an unknown trpc error
  if (!(e instanceof FMError)) throw e;

  throw e.toTRPCError();
});
