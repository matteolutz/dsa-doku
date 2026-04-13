import { useLoggedInState } from '@/utils/trpc';
import { Select } from '../ui/select';

const EventInstanceSelector = () => {
  const [_loggedInState, _setLoggedInState] = useLoggedInState();

  return <Select></Select>;
};

export default EventInstanceSelector;
