import { useLocation, useNavigate } from 'react-router';
import Header from './fm/header';
import { BottomNav } from './fm/bottomNav';

import { Home, User } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { UserContextProivder } from '@/utils/auth';
import { Suspense } from 'react';
import LoadingPage from './fm/loadingPage';
import AnimatedOutlet from './animatedOutlet';

type TopLevelRoute = {
  label: string;
  icon: IconSvgElement;
};

const TOP_LEVEL_ROUTES: Record<string, TopLevelRoute> = {
  home: {
    label: 'Home',
    icon: Home
  },
  profile: {
    label: 'Profile',
    icon: User
  }
};

const Scaffold = () => {
  const meQuery = useQuery(trpc.user.me.queryOptions());

  const navigate = useNavigate();

  const location = useLocation();
  const activeTab = location.pathname.split('/')[1];

  const user = meQuery.data?.user ?? null;

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <Header title={TOP_LEVEL_ROUTES[activeTab]?.label ?? activeTab} />
      <div className="w-full flex-1 overflow-auto">
        <Suspense fallback={<LoadingPage />}>
          {meQuery.isFetched ? (
            <UserContextProivder value={user}>
              <AnimatedOutlet />
            </UserContextProivder>
          ) : (
            <LoadingPage />
          )}
        </Suspense>
      </div>
      <BottomNav
        items={Object.getOwnPropertyNames(TOP_LEVEL_ROUTES).map((route) => ({
          label: TOP_LEVEL_ROUTES[route].label,
          icon: TOP_LEVEL_ROUTES[route].icon,
          value: route
        }))}
        activeTab={activeTab}
        onActiveTabChange={(tab) => navigate(tab)}
      />
    </div>
  );
};

export default Scaffold;
