import { useEffect, useEffectEvent, useState, type FC } from 'react';
import type { DocCreationMethod, DocCreationMethodCommonProps } from './types';
import { useMutation } from '@tanstack/react-query';
import { queryClient, trpc } from '@/utils/trpc';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { apiUrl } from '@/utils/api';
import { useSubscription } from '@trpc/tanstack-react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Check, Upload } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

const RENUMBERING_SUPPORT = ['.docx'];

export type DocFileCreationProps = {
  fileConfig: NonNullable<DocCreationMethod['fileConfig']>;
} & DocCreationMethodCommonProps;

type FormInputs = {
  file: FileList;
  title: string;
  containsPageNumbers: boolean;
};

export const DocCreateFileForm: FC<DocFileCreationProps> = ({
  setProgress,
  currentProgress,
  docType,
  fileConfig
}) => {
  const [newDocId, setNewDocId] = useState<string | null>(null);

  useSubscription(
    trpc.doc.onConversionEvent.subscriptionOptions(
      {
        docId: newDocId ?? ''
      },
      {
        enabled: newDocId !== null,
        onStarted: () => console.log('sub started'),
        onData: (data) => setProgress(data)
      }
    )
  );

  const getNonceMutation = useMutation(
    trpc.doc.getUploadNonce.mutationOptions()
  );
  const createDocMutation = useMutation(
    trpc.doc.create.mutationOptions({
      onSuccess: () => {
        return queryClient.invalidateQueries({
          queryKey: trpc.doc.getAll.queryKey()
        });
      }
    })
  );

  const createForm = useForm<FormInputs>();

  useEffect(() => {
    createForm.reset();
    setNewDocId(null);
  }, [docType, fileConfig, createForm]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const uploadedFileList = createForm.watch('file');
  const uploadedFile =
    uploadedFileList?.length > 0 ? uploadedFileList[0] : null;

  const renumberingDisabled = !RENUMBERING_SUPPORT.includes(fileConfig.accept);

  const setTitle = useEffectEvent((title: string) =>
    createForm.setValue('title', title)
  );
  useEffect(() => {
    if (!uploadedFile) return;

    setTitle(uploadedFile.name);
  }, [uploadedFile]);

  const navigate = useNavigate();

  const onSubmit = async (data: FormInputs) => {
    const nonce = await getNonceMutation.mutateAsync();

    const fileUploadData = new FormData();
    fileUploadData.set('file', data.file[0]);

    const { docId, originalFileName } = await fetch(
      apiUrl(`fs/doc?nonce=${nonce}`),
      {
        method: 'POST',
        body: fileUploadData
      }
    ).then((res) => res.json());

    setNewDocId(docId);

    console.log(docType);

    await createDocMutation.mutateAsync({
      docId,
      originalFileName,
      documentType: docType,
      title: data.title,
      containsPageNumbers: renumberingDisabled
        ? false
        : (data.containsPageNumbers ?? false)
    });

    navigate('/sections');
  };

  return (
    <form onSubmit={createForm.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Datei</label>
          <label
            htmlFor="file"
            className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/60 px-4 py-8 text-center transition hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <HugeiconsIcon icon={Upload} className="h-5 w-5" />
            </div>
            {uploadedFile ? (
              <>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Klicken, um eine andere Datei zu wählen
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Datei auswählen oder hierher ziehen
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileConfig.uploadHint}
                </p>
              </>
            )}
            <Input
              accept={fileConfig.accept}
              id="file"
              type="file"
              className="sr-only"
              required
              {...createForm.register('file')}
            />
          </label>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="z.B. Einführung in die Spieltheorie"
          required
          {...createForm.register('title')}
        />
      </div>
      {!renumberingDisabled && (
        <div className="flex gap-2">
          <Controller
            name="containsPageNumbers"
            control={createForm.control}
            render={({ field }) => (
              <label
                className={cn(
                  'w-full flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background/60 p-4 transition hover:border-primary/30'
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    field.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background'
                  }`}
                >
                  {field.value && (
                    <HugeiconsIcon
                      icon={Check}
                      className="h-3.5 w-3.5"
                      strokeWidth={3}
                    />
                  )}
                </button>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    Das Dokument enthält Seitenzahlen
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vorhandene Seitenzahlen werden automatisiert entfernt,
                    sodass die gesamte Doku einheitlich nummeriert werden kann.
                  </p>
                </div>
              </label>
            )}
          />
        </div>
      )}
      <Button
        disabled={createForm.formState.isSubmitting}
        type="submit"
        className="w-full"
        size="lg"
      >
        {currentProgress?.message ?? 'Erstellen'}
        {createForm.formState.isSubmitting && (
          <Spinner data-icon="inline-start" />
        )}
      </Button>
    </form>
  );
};
