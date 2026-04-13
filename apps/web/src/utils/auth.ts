import type { SafeUser } from '@repo/db/types';
import { createContext, useContext } from 'react';

export type UserFetchingState =
  | null
  | {
      state: 'loading';
    }
  | {
      state: 'loaded';
      user: SafeUser;
    }
  | {
      state: 'error';
      error: unknown;
    };

const UserContext = createContext<UserFetchingState>(null);
export const UserContextProivder = UserContext.Provider;

export const useUserFetchingState = () => {
  return useContext(UserContext);
};

export const useUser = () => {
  const user = useContext(UserContext);
  if (!user || user.state !== 'loaded')
    throw new Error('useUser must be used within a UserProvider');

  return user.user;
};
