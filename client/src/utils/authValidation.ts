export interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export const validateAuthForm = (
  mode: 'login' | 'signup',
  name: string,
  email: string,
  password: string
): FieldErrors => {
  const errors: FieldErrors = {};

  if (mode === 'signup' && !name.trim()) {
    errors.name = 'Full name is required';
  }

  if (!email.trim()) {
    errors.email = 'Email address is required';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};
