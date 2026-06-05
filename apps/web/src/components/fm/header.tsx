import type { FC } from 'react';
import AcademySelector from './academySelector';
import { useAuthStore } from '@/utils/trpc';
import { Button } from '../ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Back } from '@hugeicons/core-free-icons';
import { useNavigate } from 'react-router';

export type HeaderProps = {
  title?: string;
  showBackButton?: boolean;
  disableAcademySelector?: boolean;
};

const Header: FC<HeaderProps> = ({
  title,
  showBackButton = false,
  disableAcademySelector = false
}) => {
  const authState = useAuthStore();

  const navigate = useNavigate();

  return (
    <div className="w-full shrink-0 h-15 border-b bg-card flex justify-center">
      <div className="w-full max-w-5xl max-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex gap-2 h-full items-center">
          {showBackButton && (
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon">
              <HugeiconsIcon icon={Back} />
            </Button>
          )}
          {title ? (
            <h1 className="font-semibold tracking-tight text-lg">{title}</h1>
          ) : (
            <div></div>
          )}
        </div>
        {authState.isLoggedIn() && !disableAcademySelector && (
          <AcademySelector />
        )}
      </div>
    </div>
  );
};

export default Header;
