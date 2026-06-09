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
import { Spinner } from '@/components/ui/spinner';
import { queryClient, trpc, useAuthStore } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';

type FormInputs = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const loginMutation = useMutation(trpc.auth.login.mutationOptions());

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('r');

  const navigate = useNavigate();

  const loginForm = useForm<FormInputs>();

  const authState = useAuthStore();

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    loginMutation.mutateAsync(data).then(async (tokens) => {
      authState.login(tokens);
      await queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey()
      }); // make sure we refetch the user

      if (redirect !== null) {
        console.log('[LOGIN] redirecting to', redirect);
        navigate(redirect);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription>
            Melde Dich an, um auf die Dokumentation deiner Akademie zuzugreifen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={loginForm.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                {...loginForm.register('email')}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                {...loginForm.register('password')}
              />
            </div>
            <Button
              disabled={loginMutation.isPending}
              type="submit"
              className="w-full"
              size="lg"
            >
              Anmelden
              {loginMutation.isPending && <Spinner data-icon="inline-start" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Du hast noch keinen Account?&nbsp;
          <Link
            to="../register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Registrieren
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
