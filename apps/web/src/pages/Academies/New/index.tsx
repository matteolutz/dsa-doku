import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { queryClient, trpc } from '@/utils/trpc';
import { ChevronLeft } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { AcademyMeta } from '@repo/db/types';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

type NewAcademyFormInputs = {
  year: number;
  yearIdx: number;

  location: string;

  tnBeginDate: string;
  tnEndDate: string;

  doku: AcademyMeta['doku'];
  akaJournal: AcademyMeta['akaJournal'];
};

export const NewAcademyPage = () => {
  const navigate = useNavigate();

  const newAcademyForm = useForm<NewAcademyFormInputs>();
  const newAcademyMutation = useMutation(
    trpc.academy.create.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.academy.getSelectable.queryKey()
        })
    })
  );

  const onSubmit = async (data: NewAcademyFormInputs) => {
    const academy = await newAcademyMutation.mutateAsync({
      year: Number(data.year),
      yearIdx: Number(data.yearIdx),
      location: data.location,
      tnBeginDate: data.tnBeginDate,
      tnEndDate: data.tnEndDate,
      meta: {
        doku: data.doku,
        akaJournal: data.akaJournal
      }
    });

    console.log('created new academy', academy);
    navigate(-1);
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const akaJournal = newAcademyForm.watch('akaJournal');
  const isAkaJournalEnabled = typeof akaJournal !== 'undefined';

  const akaJournalAuth = akaJournal?.apiAuthentication;
  const isAkaJournalAuthEnabled = typeof akaJournalAuth !== 'undefined';

  return (
    <div className="size-full p-4 flex justify-center relative">
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            className="cursor-pointer"
            size="icon"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Neue Akademie
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstelle eine neue Akademie.
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <form
            onSubmit={newAcademyForm.handleSubmit(onSubmit)}
            className="grid gap-6"
          >
            <h3 className="text-xl font-semibold tracking-tight">Grunddaten</h3>

            <div className="grid gap-2">
              <Label htmlFor="year">Jahr und Index</Label>
              <div className="flex w-full gap-2">
                <Input
                  id="year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  required
                  {...newAcademyForm.register('year')}
                />

                <Input
                  id="yearIdx"
                  type="number"
                  placeholder="1"
                  required
                  {...newAcademyForm.register('yearIdx')}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                type="text"
                placeholder="z.B. Schwäbisch Gmünd"
                required
                {...newAcademyForm.register('location')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tnBeginDate">TN-An- und Abreise</Label>
              <div className="flex w-full gap-2">
                <Input
                  id="tnBeginDate"
                  type="date"
                  required
                  {...newAcademyForm.register('tnBeginDate')}
                />

                <Input
                  id="tnEndDate"
                  type="date"
                  required
                  {...newAcademyForm.register('tnEndDate')}
                />
              </div>
            </div>

            <hr />

            <h3 className="text-xl font-semibold tracking-tight">Doku</h3>

            <div className="grid gap-2">
              <Label htmlFor="doku-coverPageDetailedLocation">
                Genauer Ort (Deckblatt)
              </Label>
              <Input
                id="doku-coverPageDetailedLocation"
                type="text"
                placeholder="z.B. am LGH Schwäbisch Gmünd"
                required
                {...newAcademyForm.register('doku.coverPageDetailedLocation')}
              />
            </div>

            <hr />

            <h3 className="text-xl font-semibold tracking-tight">
              Aka-Journal
            </h3>

            <div className="flex gap-2">
              <Checkbox
                id="akaJournalEnabled"
                checked={isAkaJournalEnabled}
                onCheckedChange={(checked) =>
                  newAcademyForm.setValue(
                    'akaJournal',
                    checked
                      ? {
                          apiEndpoint: '',
                          baseEndpoint: '',
                          apiAuthentication: undefined
                        }
                      : undefined
                  )
                }
              />

              <Label htmlFor="akaJournalEnabled">Aka-Journal aktivieren</Label>
            </div>

            {isAkaJournalEnabled && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="akaJournalBaseEndpoint">Basis-URL</Label>
                  <Input
                    id="akaJournalBaseEndpoint"
                    type="text"
                    placeholder="z.B. https://doku1.schuelerakademien.de"
                    required
                    {...newAcademyForm.register('akaJournal.baseEndpoint')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="akaJournalApiEndpoint">API-URL</Label>
                  <Input
                    id="akaJournalApiEndpoint"
                    type="text"
                    placeholder="z.B. https://doku1.schuelerakademien.de/wp-json"
                    required
                    {...newAcademyForm.register('akaJournal.apiEndpoint')}
                  />
                </div>

                <div className="flex gap-2">
                  <Checkbox
                    id="akaJournalAuthEnabled"
                    checked={isAkaJournalAuthEnabled}
                    onCheckedChange={(checked) =>
                      newAcademyForm.setValue(
                        'akaJournal.apiAuthentication',
                        checked
                          ? {
                              type: 'applicationPassword',
                              username: '',
                              applicationPassword: ''
                            }
                          : undefined
                      )
                    }
                  />

                  <Label htmlFor="akaJournalAuthEnabled">
                    Authentifizierung aktivieren
                  </Label>
                </div>

                {isAkaJournalAuthEnabled && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="akaJournalApiAuthType">
                        Authentifizierungstyp
                      </Label>
                      <Select
                        value={akaJournalAuth.type}
                        onValueChange={(value) => {
                          if (value === 'applicationPassword') {
                            newAcademyForm.setValue(
                              'akaJournal.apiAuthentication',
                              {
                                type: 'applicationPassword',
                                username: '',
                                applicationPassword: ''
                              }
                            );
                          } else if (value === 'cookie') {
                            newAcademyForm.setValue(
                              'akaJournal.apiAuthentication',
                              {
                                type: 'cookie',
                                username: '',
                                password: '',
                                wpLoginEndpoint: ''
                              }
                            );
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applicationPassword">
                            Anwendungspasswort
                          </SelectItem>
                          <SelectItem value="cookie">Cookie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {akaJournalAuth.type === 'cookie' && (
                      <div className="grid gap-2">
                        <Label htmlFor="akaJournalAuthLoginEndpoint">
                          Login-Endpoint
                        </Label>
                        <Input
                          id="akaJournalAuthLoginEndpoint"
                          type="text"
                          placeholder="z.B. https://doku1.schuelerakademien.de/wp-login.php"
                          required
                          {...newAcademyForm.register(
                            'akaJournal.apiAuthentication.wpLoginEndpoint'
                          )}
                        />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="akaJournalApiAuthUsername">
                        Benutzername
                      </Label>
                      <Input
                        id="akaJournalApiAuthUsername"
                        type="text"
                        placeholder="z.B. Max.Mustermann"
                        required
                        {...newAcademyForm.register(
                          'akaJournal.apiAuthentication.username'
                        )}
                        autoComplete="off"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="akaJournalApiAuthPassword">
                        {akaJournalAuth.type === 'applicationPassword'
                          ? 'Anwendungspasswort'
                          : 'Passwort'}
                      </Label>
                      <Input
                        id="akaJournalApiAuthPassword"
                        type="text"
                        placeholder="z.B. AAAA-BBBB-CCCC-DDDD"
                        required
                        {...newAcademyForm.register(
                          akaJournalAuth.type === 'applicationPassword'
                            ? 'akaJournal.apiAuthentication.applicationPassword'
                            : 'akaJournal.apiAuthentication.password'
                        )}
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <Button
              disabled={newAcademyForm.formState.isSubmitted}
              type="submit"
              className="w-full"
              size="lg"
            >
              Erstellen
              {newAcademyForm.formState.isSubmitted && (
                <Spinner data-icon="inline-start" />
              )}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};
