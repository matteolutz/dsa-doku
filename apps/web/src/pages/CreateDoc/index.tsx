import { TypographyH2 } from '@/components/fm/typography';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiUrl } from '@/utils/api';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';

// mime types, for which we support renumbering
const RENUMBERING_SUPPORT = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

type FormInputs = {
  file: FileList;
  name: string;
  containsPageNumbers: boolean;
};

const CreateDocPage = () => {
  const [searchParams] = useSearchParams();
  const docType = JSON.parse(atob(searchParams.get('t') ?? '') || '{}');

  const createForm = useForm<FormInputs>();

  const uploadedFileList = createForm.watch('file');
  const uploadedFile =
    uploadedFileList?.length > 0 ? uploadedFileList[0] : null;

  const disableContainsPageNumbers = useEffectEvent(() =>
    createForm.resetField('containsPageNumbers')
  );
  useEffect(() => {
    if (uploadedFile && !RENUMBERING_SUPPORT.includes(uploadedFile.type)) {
      disableContainsPageNumbers();
    }
  }, [uploadedFile]);

  const getNonceMutation = useMutation(
    trpc.doc.getUploadNonce.mutationOptions()
  );
  const createDocMutation = useMutation(trpc.doc.create.mutationOptions());

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

    console.log(docType);

    await createDocMutation.mutateAsync({
      docId,
      originalFileName,
      documentType: docType,
      name: data.name,
      containsPageNumbers: data.containsPageNumbers
    });

    navigate('/sections');
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
            <Controller
              name="containsPageNumbers"
              control={createForm.control}
              render={({ field }) => (
                <Checkbox
                  id="containsPageNumbers"
                  name={field.name}
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked == 'indeterminate' ? false : checked)
                  }
                  disabled={
                    !!uploadedFile &&
                    !RENUMBERING_SUPPORT.includes(uploadedFile.type)
                  }
                />
              )}
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
