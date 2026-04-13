import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

const NotFoundPage = () => {
  return (
    <div className="size-full flex justify-center items-center flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-center">
        Ooops... this page doesn't exist
      </h1>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
