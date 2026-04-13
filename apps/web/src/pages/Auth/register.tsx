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
import { Link } from 'react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { queryClient, trpc, useAuthStore } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';

type FormInputs = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage = () => {
  const registerMutation = useMutation(trpc.auth.register.mutationOptions());

  const registerForm = useForm<FormInputs>();

  const authState = useAuthStore();

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    registerMutation.mutateAsync(data).then((tokens) => {
      authState.login(tokens);
      queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() }); // make sure we refetch the user
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            Sign up to start managing your festivals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={registerForm.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Jane"
                required
                autoComplete="name"
                {...registerForm.register('firstName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Smith"
                required
                autoComplete="name"
                {...registerForm.register('lastName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                {...registerForm.register('email')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                {...registerForm.register('password')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
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
            >
              Create account
              {registerMutation.isPending && (
                <Spinner data-icon="inline-start" />
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?&nbsp;
          <Link
            to="../login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
