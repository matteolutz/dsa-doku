import { useAuthStore, useLoggedInState } from './utils/trpc';

import { Navigate, Route, Routes, useLocation } from 'react-router';
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
import CreateDocPage from './pages/CreateDoc';
import ViewPage from './pages/View';
import DokuPage from './pages/Doku';
import DokuPrintPage from './pages/Doku/print';
import { NewAcademyPage } from './pages/Academies/New';
import { EditAcademyPage } from './pages/Academies/Edit';

const AuthRoute: FC<{ navigateTo?: string; element: React.ReactNode }> = ({
  navigateTo,
  element
}) => {
  const user = useUserFetchingState();
  const location = useLocation();

  if (user?.state == 'loading') {
    return <LoadingPage />;
  }

  if (!user || user.state !== 'loaded') {
    console.log(
      '[AUTH_ROUTE] not authenticated, redirecting to login with pathname',
      location.pathname
    );
    return (
      <Navigate to={navigateTo ?? `/profile/login?r=${location.pathname}`} />
    );
  }

  return element;
};

const AcademyRoute: FC<{ navigateTo?: string; element: React.ReactNode }> = ({
  element,
  navigateTo
}) => {
  const Internal = () => {
    const [loggedInState] = useLoggedInState();
    if (!loggedInState.selectedAcademy) return null;

    return element;
  };

  return <AuthRoute navigateTo={navigateTo} element={<Internal />} />;
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
          <Route
            index
            element={
              isLoggedIn ? (
                <AuthRoute element={<ProfilePage />} />
              ) : (
                <Navigate to="./login" />
              )
            }
          />

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
          element={<AcademyRoute element={<SectionsPage />} />}
        />

        <Route path="doku" element={<AuthRoute element={<DokuPage />} />} />

        <Route path="doc">
          <Route
            path="create"
            element={<AuthRoute element={<CreateDocPage />} />}
          />
        </Route>

        <Route path="academies">
          <Route
            path="new"
            element={<AuthRoute element={<NewAcademyPage />} />}
          />

          {/* Edit route (just match /academies/:id) */}
          <Route
            path=":id"
            element={<AuthRoute element={<EditAcademyPage />} />}
          />
        </Route>

        <Route path="loading" element={<LoadingPage />} />

        <Route path="view" element={<AcademyRoute element={<ViewPage />} />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Routes that require all the contexts provided by <Scaffold />, but not the header or navbar (i.e. "naked" scaffold) */}
      <Route path="/print" element={<Scaffold naked />}>
        <Route
          path="doku"
          element={<AuthRoute element={<DokuPrintPage />} />}
        />
      </Route>
    </Routes>
  );
};

export default App;
