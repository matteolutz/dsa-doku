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
import { Link } from 'react-router';

type FormInputs = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const loginMutation = useMutation(trpc.auth.login.mutationOptions());

  const loginForm = useForm<FormInputs>();

  const authState = useAuthStore();

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    loginMutation.mutateAsync(data).then((tokens) => {
      authState.login(tokens);
      queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() }); // make sure we refetch the user
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access the festival manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={loginForm.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
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
            >
              Sign In
              {loginMutation.isPending && <Spinner data-icon="inline-start" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Don&apos;t have an account?&nbsp;
          <Link
            to="../register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
