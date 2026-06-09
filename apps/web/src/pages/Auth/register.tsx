import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { queryClient, trpc, useAuthStore } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';

type FormInputs = {
  registrationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage = () => {
  const registerMutation = useMutation(trpc.auth.register.mutationOptions());

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('r');

  const navigate = useNavigate();

  const registerForm = useForm<FormInputs>();

  const authState = useAuthStore();

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    registerMutation.mutateAsync(data).then(async (tokensAndId) => {
      authState.login(tokensAndId);

      await queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey()
      }); // make sure we refetch the user

      if (redirect !== null) {
        console.log('[REGISTER] redirecting to', redirect);
        navigate(redirect);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Account erstellen</CardTitle>
          <CardDescription>
            Erstelle einen neuen Account mit einem Registrierungscode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={registerForm.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="registrationCode">Registrierungscode</Label>
              <Input
                id="registrationCode"
                type="text"
                placeholder="Registrierungscode eingeben"
                required
                autoComplete="name"
                {...registerForm.register('registrationCode')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Max"
                required
                autoComplete="name"
                {...registerForm.register('firstName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Mustermann"
                required
                autoComplete="name"
                {...registerForm.register('lastName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="max.mustermann@beispiel.de"
                required
                autoComplete="email"
                {...registerForm.register('email')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                {...registerForm.register('password')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                {...registerForm.register('confirmPassword')}
              />
            </div>
            <Button
              disabled={registerMutation.isPending}
              type="submit"
              className="w-full"
              size="lg"
            >
              Registrieren
              {registerMutation.isPending && (
                <Spinner data-icon="inline-start" />
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Du hast bereits einen Account?&nbsp;
          <Link
            to="../login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Anmelden
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
