import LoadingPage from '@/components/fm/loadingPage';
import { Button } from '@/components/ui/button';
import { useUserOrNull } from '@/utils/auth';
import { useAuthStore } from '@/utils/trpc';

const ProfilePage = () => {
  const authState = useAuthStore();
  const user = useUserOrNull();

  if (!user) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div>{user.email}</div>
      <Button onClick={() => authState.logout()}>Logout</Button>
    </div>
  );
};

export default ProfilePage;
