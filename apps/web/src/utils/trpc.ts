import type { AppRouter } from '@repo/trpc';
import { QueryClient } from '@tanstack/react-query';
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink
} from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import SuperJSON from 'superjson';
import { apiUrl } from './api';

import type { TRPCLink } from '@trpc/client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SetStateAction } from 'react';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export type LoggedInState = {
  selectedAcademy: number | null;
};

const DEFAULT_LOGGED_IN_STATE: LoggedInState = {
  selectedAcademy: null
};

export type AuthState =
  | {
      state: 'logged-out';
    }
  | {
      state: 'logged-in';
      accessToken: string;
      refreshToken: string;

      data: LoggedInState;
    }
  | {
      state: 'refreshing';
      refreshToken: string;

      data: LoggedInState;
    };

export type AuthContextState = {
  state: AuthState;

  isLoggedIn: () => boolean;

  matchAuthState: <T>({
    loggedOut,
    loggedIn,
    refreshing
  }: {
    loggedOut?: () => T;
    loggedIn?: (
      tokens: { accessToken: string; refreshToken: string },
      data: LoggedInState
    ) => T;
    refreshing?: (refreshToken: string) => T;
  }) => T | null;

  login: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;

  setLoggedInState: (state: SetStateAction<LoggedInState>) => void;
};

export function createAuthClient({ url }: { url: string }) {
  // trpc client stuff
  const refreshingRef: { promise: null | Promise<boolean> } = {
    promise: null
  };

  const refresh = async () => {
    console.log('refreshing token');

    const state = useAuthStore.getState().state;
    if (state.state === 'logged-out') return false;

    const refreshToken = state.refreshToken;
    useAuthStore.setState({
      state: { state: 'refreshing', refreshToken, data: state.data }
    });

    const { accessToken } = await trpcClient.auth.refresh.mutate();

    useAuthStore.setState({
      state: { state: 'logged-in', accessToken, refreshToken, data: state.data }
    });

    return true;
  };

  const authLink: TRPCLink<AppRouter> = () => {
    return ({ next, op }) => {
      return observable((observer) => {
        return next(op).subscribe({
          next: (value) => observer.next(value),
          complete: () => observer.complete(),
          error: async (err) => {
            const isUnauthorized = err.data?.code === 'UNAUTHORIZED';

            if (!isUnauthorized) return observer.error(err);

            // if no refresh is pending, start one
            refreshingRef.promise ??= refresh();

            // await the refresh promise
            const wasRefreshed = await refreshingRef.promise;
            refreshingRef.promise = null;

            // if the refresh failed, return the original error
            if (!wasRefreshed) return observer.error(err);

            console.log('retrying request');

            const retry = next(op).subscribe({
              next: (value) => {
                observer.next(value);
                retry.unsubscribe();
              },
              error: (err) => {
                observer.error(err);
                retry.unsubscribe();
              },
              complete: () => {
                observer.complete();
                retry.unsubscribe();
              }
            });
          }
        });
      });
    };
  };

  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      authLink,
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: httpSubscriptionLink({
          url,
          transformer: SuperJSON
        }),
        false: httpBatchLink({
          url,
          transformer: SuperJSON,

          headers: () => {
            const headers: { [key: string]: string } = {};

            const bearerToken = useAuthStore.getState().matchAuthState({
              loggedIn: ({ accessToken }) => accessToken,
              refreshing: (refreshToken) => refreshToken
            });

            if (bearerToken) {
              console.log('Attaching auth headers.');
              headers['authorization'] = `Bearer ${bearerToken}`;
            }

            return headers;
          }
        })
      })
    ]
  });

  const useAuthStore = create(
    persist<AuthContextState>(
      (set, get) => ({
        state: { state: 'logged-out' },

        isLoggedIn: (): boolean => get().state.state === 'logged-in',

        matchAuthState: <T>({
          loggedOut,
          loggedIn,
          refreshing
        }: {
          loggedOut?: () => T;
          loggedIn?: (
            tokens: {
              accessToken: string;
              refreshToken: string;
            },
            data: LoggedInState
          ) => T;
          refreshing?: (refreshToken: string) => T;
        }): T | null => {
          const authState: AuthState = get().state;

          switch (authState.state) {
            case 'logged-out':
              return loggedOut?.() ?? null;
            case 'logged-in':
              return loggedIn?.(authState, authState.data) ?? null;
            case 'refreshing':
              return refreshing?.(authState.refreshToken) ?? null;
          }
        },

        login: (tokens) =>
          set({
            state: {
              state: 'logged-in',
              ...tokens,
              data: DEFAULT_LOGGED_IN_STATE
            }
          }),
        logout: () => set({ state: { state: 'logged-out' } }),

        setLoggedInState: (state: SetStateAction<LoggedInState>) => {
          const current = get();
          if (current.state.state === 'logged-out') return;

          const newData =
            typeof state === 'function' ? state(current.state.data) : state;

          set({ state: { ...current.state, data: newData } });
        }
      }),
      { name: 'auth-storage', storage: createJSONStorage(() => sessionStorage) }
    )
  );

  return {
    useAuthStore,
    trpcClient
  };
}

/*
const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrl('trpc'), transformer: SuperJSON })]
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient
});
*/

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true
    }
  }
});
const { trpcClient, useAuthStore } = createAuthClient({ url: apiUrl('trpc') });

export { trpcClient };
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient
});

export { useAuthStore };

export const useLoggedInState = (): [
  LoggedInState,
  typeof authState.setLoggedInState
] => {
  const authState = useAuthStore();

  if (authState.state.state === 'logged-out')
    throw new Error('Not authenticated');

  return [authState.state.data, authState.setLoggedInState];
};

export const useNullableSelectedAcademy = () => {
  const [loggedInState] = useLoggedInState();

  return loggedInState.selectedAcademy;
};

export const useSelectedAcademy = () => {
  const [loggedInState] = useLoggedInState();
  if (loggedInState.selectedAcademy === null)
    throw new Error('No academy selected');

  return loggedInState.selectedAcademy;
};
