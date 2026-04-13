import { useAuthStore } from './utils/trpc';

import { Navigate, Route, Routes } from 'react-router';
import HomePage from './pages/Home';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Auth/login';
import RegisterPage from './pages/Auth/register';
import { useUserFetchingState } from './utils/auth';
import LoadingPage from './components/fm/loadingPage';
import { type FC } from 'react';
import Scaffold from './components/scaffold';
import NotFoundPage from './pages/NotFound';
import SectionsPage from './pages/Sections';

const AuthRoute: FC<{ navigateTo?: string; element: React.ReactNode }> = ({
  navigateTo,
  element
}) => {
  const user = useUserFetchingState();

  if (user?.state == 'loading') {
    return <LoadingPage />;
  }

  if (!user || user.state !== 'loaded') {
    return <Navigate to={navigateTo ?? '/profile/login'} />;
  }

  return element;
};

const App = () => {
  const authState = useAuthStore();
  const isLoggedIn = authState.isLoggedIn();

  return (
    <Routes>
      <Route path="/" element={<Scaffold />}>
        <Route index element={<Navigate to="home" />} />
        <Route path="home" element={<AuthRoute element={<HomePage />} />} />

        <Route path="profile">
          <Route index element={<AuthRoute element={<ProfilePage />} />} />

          <Route
            path="register"
            element={!isLoggedIn ? <RegisterPage /> : <Navigate to="../" />}
          />
          <Route
            path="login"
            element={!isLoggedIn ? <LoginPage /> : <Navigate to="../" />}
          />
        </Route>

        <Route
          path="sections"
          element={<AuthRoute element={<SectionsPage />} />}
        />

        <Route path="loading" element={<LoadingPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
