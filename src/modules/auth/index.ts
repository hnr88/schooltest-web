export { useAuth } from './hooks/use-auth';
export { useRequireParent } from './hooks/use-require-parent';
export { useRequireTeacher } from './hooks/use-require-teacher';
export { useMeQuery } from './queries/use-me.query';
export { useLoginMutation } from './queries/use-login.mutation';
export { useRegisterMutation } from './queries/use-register.mutation';
export { useAuthStore } from './stores/use-auth-store';
export { AuthSplitLayout } from './components/AuthSplitLayout';
export { AuthCenteredLayout } from './components/AuthCenteredLayout';
export { AuthCard } from './components/AuthCard';
export { AuthBackLink } from './components/AuthBackLink';
export { AuthDivider } from './components/AuthDivider';
export { SignInCard } from './components/SignInCard';
export { SignInForm } from './components/SignInForm';
export { SignUpConfirmState } from './components/SignUpConfirmState';
export { ForgotPasswordCard } from './components/ForgotPasswordCard';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordCard } from './components/ResetPasswordCard';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { ResendCountdownButton } from './components/ResendCountdownButton';
export { SignUpCard } from './components/SignUpCard';
export { SignUpForm } from './components/SignUpForm';
export { ParentGuard } from './components/ParentGuard';
export { TeacherGuard } from './components/TeacherGuard';
export { TEACHER_ROLE_TYPE } from './constants/role.constants';
export { ChangePasswordForm } from './components/ChangePasswordForm';
export { GoogleCallbackScreen } from './components/GoogleCallbackScreen';
export { GOOGLE_ENABLED } from './constants/auth.constants';

export {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from './schemas/auth.schema';
export { signInSchema, type SignInInput } from './schemas/sign-in.schema';
export { signUpSchema, type SignUpInput } from './schemas/sign-up.schema';
export {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from './schemas/forgot-password.schema';
export { useForgotPasswordMutation } from './queries/use-forgot-password.mutation';
export {
  resetPasswordSchema,
  type ResetPasswordInput,
} from './schemas/reset-password.schema';
export { useResetPasswordMutation } from './queries/use-reset-password.mutation';
export { useResendConfirmationMutation } from './queries/use-resend-confirmation.mutation';
export {
  changePasswordSchema,
  type ChangePasswordInput,
} from './schemas/change-password.schema';
export { useChangePasswordMutation } from './queries/use-change-password.mutation';
export type {
  AuthUser,
  AuthUserRole,
  AuthResponse,
  RegisterResponse,
  ResendConfirmationResponse,
  ResendConfirmationErrorKey,
  SignInErrorKey,
  StrapiErrorBody,
  ForgotPasswordResponse,
  ForgotPasswordErrorKey,
  ResetPasswordRequest,
  ResetPasswordErrorKey,
  ChangePasswordErrorKey,
} from './types/auth.types';
