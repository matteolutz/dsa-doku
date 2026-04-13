import type { SafeUser } from '@repo/db/types';
import { createContext, useContext } from 'react';

const UserContext = createContext<SafeUser | null>(null);
export const UserContextProivder = UserContext.Provider;

export const useUserOrNull = () => {
  return useContext(UserContext);
};

export const useUser = () => {
  const user = useContext(UserContext);
  if (!user) throw new Error('useUser must be used within a UserProvider');

  return user;
};
