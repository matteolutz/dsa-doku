import type { FC } from 'react';
import AcademySelector from './academySelector';
import { useAuthStore } from '@/utils/trpc';

export type HeaderProps = {
  title?: string;
};

const Header: FC<HeaderProps> = ({ title }) => {
  const authState = useAuthStore();

  return (
    <div className="w-full border-b bg-card px-4 py-2 flex justify-between gap-4">
      {title ? <h1 className="text-xl">{title}</h1> : <div></div>}
      {authState.isLoggedIn() && <AcademySelector />}
    </div>
  );
};

export default Header;
