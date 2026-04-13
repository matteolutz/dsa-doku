import { useEffect, useState } from 'react';
import { Spinner } from '../ui/spinner';

const LoadingPage = () => {
  const [uselessFact, setUselessFact] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      // TODO: i18n
      const language = 'en';

      const fact = await fetch(
        `https://uselessfacts.jsph.pl/api/v2/facts/random?langauge=${language}`
      )
        .then((res) => res.json())
        .then(({ text }) => text);

      setUselessFact(fact);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="size-full flex flex-col justify-center items-center gap-6">
      <Spinner />
      {uselessFact && (
        <div className="max-w-100 flex flex-col items-center text-center">
          <p className="text-sm font-medium">Did you know that...</p>
          <p>{uselessFact}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingPage;
