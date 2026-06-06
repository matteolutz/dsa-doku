import { Button } from '@/components/ui/button';
import { Check, ChevronLeft } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DOC_CREATION_METHODS, type DocCreationVariant } from './types';
import { DocCreateFileForm } from './file';
import { DocCreateJournalForm } from './journal';

// mime types, for which we support renumbering
const CreateDocPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const docType = JSON.parse(atob(searchParams.get('t') ?? '') || '{}');

  const selectedCreationVariant = searchParams.get('v') ?? 'docx';
  const setSelectedCreationVariant = (variant: DocCreationVariant) => {
    searchParams.set('v', variant);
    setSearchParams(searchParams);
  };

  const [currentProgress, setCurrentProgress] = useState<{
    progress: number;
    message: string;
  } | null>(null);

  return (
    <div className="size-full p-4 flex justify-center relative">
      <div
        className="absolute top-0 left-0 h-1 bg-primary transition-transform w-full origin-left"
        style={{
          scale: currentProgress
            ? `${Math.floor(currentProgress.progress * 100)}% 100%`
            : '0 100%'
        }}
      />
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" asChild>
            <Link to="/sections">
              <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Neues Dokument
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle eine Quelle und ergänze die Details.
            </p>
          </div>
        </div>

        {/* Variant selector */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quelle wählen
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(DOC_CREATION_METHODS).map(([variant, method]) => {
              const active = selectedCreationVariant === variant;

              return (
                <button
                  key={variant}
                  type="button"
                  onClick={() => {
                    setSelectedCreationVariant(variant as DocCreationVariant);
                  }}
                  className={`group relative flex flex-col items-start gap-3 rounded-3xl border bg-card p-4 text-left shadow-card transition ${
                    active
                      ? 'border-primary/60 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary-soft text-primary'
                    }`}
                  >
                    <HugeiconsIcon icon={method.icon} className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{method.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <HugeiconsIcon
                        icon={Check}
                        className="h-3 w-3"
                        strokeWidth={3}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          {selectedCreationVariant === 'docx' ||
          selectedCreationVariant === 'latex' ? (
            <DocCreateFileForm
              fileConfig={
                DOC_CREATION_METHODS[selectedCreationVariant].fileConfig!
              }
              docType={docType}
              setProgress={setCurrentProgress}
              currentProgress={currentProgress}
            />
          ) : selectedCreationVariant === 'aka-journal' ? (
            <DocCreateJournalForm
              docType={docType}
              setProgress={setCurrentProgress}
              currentProgress={currentProgress}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default CreateDocPage;
