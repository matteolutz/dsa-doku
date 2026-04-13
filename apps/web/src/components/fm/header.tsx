import type { FC } from 'react';

export type HeaderProps = {
  title?: string;
};

const Header: FC<HeaderProps> = ({ title }) => {
  return (
    <div className="w-full border-b bg-card px-4 py-2">
      {title && <h1 className="text-xl">{title}</h1>}
    </div>
  );
};

export default Header;
