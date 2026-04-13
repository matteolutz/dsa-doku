import { Outlet, useLocation } from 'react-router';
import { AnimatePresence } from 'framer-motion';

const AnimatedOutlet = () => {
  const location = useLocation();

  console.log('rerendering with', location);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Outlet key={location.pathname} />
    </AnimatePresence>
  );
};

export default AnimatedOutlet;
