import { useEffect, useState } from 'react';
import { Spinner } from '../ui/spinner';

const LoadingPage = () => {
  const [uselessFact, setUselessFact] = useState<string | null>(null);
  const [longerThanExpected, setLongerThanExpected] = useState(false);

  useEffect(() => {
    const factTimeout = setTimeout(async () => {
      // TODO: i18n
      const language = 'de';

      const fact = await fetch(
        `https://uselessfacts.jsph.pl/api/v2/facts/random?language=${language}`
      )
        .then((res) => res.json())
        .then(({ text }) => text);

      setUselessFact(fact);
    }, 1000);

    const longerThanExpectedTimeout = setTimeout(
      () => setLongerThanExpected(true),
      5000
    );

    return () => {
      clearTimeout(factTimeout);
      clearTimeout(longerThanExpectedTimeout);
    };
  }, []);

  return (
    <div className="size-full flex flex-col justify-center items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <Spinner />
        {longerThanExpected && (
          <p className="text-sm text-muted-foreground">
            Hmmm, das braucht länger als erwartet...
          </p>
        )}
      </div>

      {uselessFact && (
        <div className="max-w-100 flex flex-col gap-0.5 items-center text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Wusstest Du schon?
          </p>
          <p className="text-sm">{uselessFact}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingPage;
