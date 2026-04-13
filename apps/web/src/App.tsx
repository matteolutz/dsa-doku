import { useAuthStore } from './utils/trpc';

import { Navigate, Route, Routes } from 'react-router';
import HomePage from './pages/Home';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Auth/login';
import RegisterPage from './pages/Auth/register';
import { useUserOrNull } from './utils/auth';
import LoadingPage from './components/fm/loadingPage';
import { type FC } from 'react';
import Scaffold from './components/scaffold';
import NotFoundPage from './pages/NotFound';

const AuthRoute: FC<{ navigateTo?: string; element: React.ReactNode }> = ({
  navigateTo,
  element
}) => {
  const user = useUserOrNull();

  if (!user) {
    return <Navigate to={navigateTo ?? '/'} />;
  }

  return element;
};

const App = () => {
  const authState = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Scaffold />}>
        <Route index element={<Navigate to="home" />} />
        <Route path="home" element={<HomePage />} />

        <Route path="profile">
          <Route
            index
            element={
              authState.isLoggedIn() ? <ProfilePage /> : <Navigate to="login" />
            }
          />

          <Route
            path="register"
            element={
              !authState.isLoggedIn() ? <RegisterPage /> : <Navigate to="../" />
            }
          />
          <Route
            path="login"
            element={
              !authState.isLoggedIn() ? <LoginPage /> : <Navigate to="../" />
            }
          />
        </Route>

        <Route path="loading" element={<LoadingPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
