import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import express from "express";

export const trpcExpress: express.Handler = createExpressMiddleware({
  router: appRouter,
  createContext: createContext
});
