import { Button } from '@/components/ui/button';
import { useUser } from '@/utils/auth';
import { useAuthStore } from '@/utils/trpc';

const ProfilePage = () => {
  const authState = useAuthStore();
  const user = useUser();

  return (
    <div>
      <div>{user.email}</div>
      <Button onClick={() => authState.logout()}>Logout</Button>
    </div>
  );
};

export default ProfilePage;
