import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';

const HomePage = () => {
  const createDocMutation = useMutation(trpc.doc.create.mutationOptions());

  const test = async () => {
    await createDocMutation.mutateAsync();
  };

  return (
    <div className="flex flex-col p-2 gap-2">
      <p>Home</p>
      <Button onClick={test}>test</Button>
    </div>
  );
};

export default HomePage;
