import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../../lib/validation/login.schema';
import { login } from '../../lib/api/auth';
import { setAuthUser } from '../../lib/auth/token';
import { ROUTES } from '../../lib/constants/routes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Checkbox } from '../../components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoginForm() {
  const navigate = useNavigate();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      // Store user in localStorage (tokens are in httpOnly cookies)
      setAuthUser(user);
      navigate(ROUTES.HOME);
    },
    onError: (error: Error) => {
      // Handle backend validation errors
      const errorMessage = error.message;
      
      // Try to extract field-specific errors if backend returns them
      if (errorMessage.includes('login') || errorMessage.includes('Login')) {
        setError('login', { message: errorMessage });
      } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
        setError('password', { message: errorMessage });
      } else {
        setError('root', { message: errorMessage });
      }
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const { rememberMe, ...loginData } = data;
    mutation.mutate(loginData);
  };

  const isLoading = isSubmitting || mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}

      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="login">Email or Username</Label>
        <Input
          id="login"
          type="text"
          {...registerField('login')}
          disabled={isLoading}
          placeholder="Enter your email or username"
          aria-invalid={errors.login ? 'true' : 'false'}
          aria-describedby={errors.login ? 'login-error' : undefined}
        />
        {errors.login && (
          <p id="login-error" className="text-sm text-destructive" role="alert">
            {errors.login.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          {...registerField('password')}
          disabled={isLoading}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          {...registerField('rememberMe')}
          disabled={isLoading}
        />
        <Label
          htmlFor="rememberMe"
          className="text-sm font-normal cursor-pointer"
        >
          Remember me
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log in
      </Button>
    </form>
  );
}

