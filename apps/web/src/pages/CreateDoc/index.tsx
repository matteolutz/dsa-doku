import { TypographyH2 } from '@/components/fm/typography';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiUrl } from '@/utils/api';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';

type FormInputs = {
  file: FileList;
  name: string;
  containsPageNumbers: string;
};

const CreateDocPage = () => {
  const [searchParams] = useSearchParams();
  const docType = JSON.parse(atob(searchParams.get('t') ?? '') || '{}');
  console.log(docType);

  const createForm = useForm<FormInputs>();

  const createDocMutation = useMutation(trpc.doc.create.mutationOptions());

  const onSubmit = async (data: FormInputs) => {
    const fileUploadData = new FormData();
    fileUploadData.set('file', data.file[0]);

    const { docId, originalFileName } = await fetch(apiUrl('fs/doc'), {
      method: 'POST',
      body: fileUploadData
    }).then((res) => res.json());

    console.log(docType);

    const doc = await createDocMutation.mutateAsync({
      docId,
      originalFileName,
      documentType: docType,
      name: data.name,
      containsPageNumbers: data.containsPageNumbers === 'on'
    });

    console.log(doc);
  };

  return (
    <div className="size-full p-4 flex justify-center">
      <div className="w-200 max-w-200 flex flex-col gap-4">
        <TypographyH2>Neues Dokument</TypographyH2>
        <form
          onSubmit={createForm.handleSubmit(onSubmit)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="file">Datei</Label>
            <Input
              id="file"
              type="file"
              required
              {...createForm.register('file')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              required
              {...createForm.register('name')}
            />
          </div>
          <div className="flex gap-2">
            <Label htmlFor="containsPageNumbers">
              Das Dokument enthält Seitenzahlen?
            </Label>
            <Checkbox
              id="containsPageNumbers"
              {...createForm.register('containsPageNumbers')}
            />
          </div>
          <Button
            disabled={createForm.formState.isSubmitting}
            type="submit"
            className="w-full"
          >
            Erstellen
            {createForm.formState.isSubmitting && (
              <Spinner data-icon="inline-start" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateDocPage;
