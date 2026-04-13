import { useLocation, useNavigate } from 'react-router';
import Header from './fm/header';
import { BottomNav } from './fm/bottomNav';

import { Layout, User, Home, QuillWriteIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';
import { trpc, useAuthStore } from '@/utils/trpc';
import { UserContextProivder, type UserFetchingState } from '@/utils/auth';
import { Suspense } from 'react';
import LoadingPage from './fm/loadingPage';
import AnimatedOutlet from './animatedOutlet';

type TopLevelRoute = {
  label: string;
  icon: IconSvgElement;

  disabledWhenNoAcademy: boolean;
  hiddenWhenLoggedOut: boolean;
};

const TOP_LEVEL_ROUTES: Record<string, TopLevelRoute> = {
  home: {
    label: 'Home',
    icon: Home,
    disabledWhenNoAcademy: false,
    hiddenWhenLoggedOut: true
  },
  sections: {
    label: 'Beiträge',
    icon: QuillWriteIcon,
    disabledWhenNoAcademy: true,
    hiddenWhenLoggedOut: true
  },
  formatting: {
    label: 'Layout',
    icon: Layout,
    disabledWhenNoAcademy: true,
    hiddenWhenLoggedOut: true
  },
  profile: {
    label: 'Profil',
    icon: User,
    disabledWhenNoAcademy: false,
    hiddenWhenLoggedOut: false
  }
};

const Scaffold = () => {
  const authState = useAuthStore();

  const isLoggedIn = authState.isLoggedIn();
  const academySelected =
    authState.matchAuthState({
      loggedIn: (_, data) => data.selectedAcademy !== null
    }) ?? false;

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const navigate = useNavigate();

  const location = useLocation();
  const activeTab = location.pathname.split('/')[1];

  const userFetchingState: UserFetchingState = meQuery.data?.user
    ? { state: 'loaded', user: meQuery.data.user }
    : meQuery.error
      ? { state: 'error', error: meQuery.error }
      : isLoggedIn
        ? { state: 'loading' }
        : null;

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <Header title={TOP_LEVEL_ROUTES[activeTab]?.label ?? activeTab} />
      <div className="w-full flex-1 overflow-auto">
        <Suspense fallback={<LoadingPage />}>
          {meQuery.isFetched || meQuery.failureCount >= 1 ? (
            <UserContextProivder value={userFetchingState}>
              <AnimatedOutlet />
            </UserContextProivder>
          ) : (
            <LoadingPage />
          )}
        </Suspense>
      </div>
      <BottomNav
        items={Object.getOwnPropertyNames(TOP_LEVEL_ROUTES)
          .filter(
            (route) =>
              isLoggedIn || !TOP_LEVEL_ROUTES[route].hiddenWhenLoggedOut
          )
          .map((route) => ({
            label: TOP_LEVEL_ROUTES[route].label,
            icon: TOP_LEVEL_ROUTES[route].icon,
            value: route,
            disabled:
              TOP_LEVEL_ROUTES[route].disabledWhenNoAcademy && !academySelected
          }))}
        activeTab={activeTab}
        onActiveTabChange={(tab) => navigate(tab)}
      />
    </div>
  );
};

export default Scaffold;
