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
export { SchoolAdminGuard } from './components/SchoolAdminGuard';
export { useRequireSchoolAdmin } from './hooks/use-require-school-admin';
export { SchoolStaffGuard } from './components/SchoolStaffGuard';
export { useRequireSchoolStaff } from './hooks/use-require-school-staff';
export { OpsGuard } from './components/OpsGuard';
export { MfaStepUpHost } from './components/MfaStepUpHost';
export { MfaEnrolPanel } from './components/MfaEnrolPanel';
export { MfaRecoveryCodes } from './components/MfaRecoveryCodes';
export { useRequireOps } from './hooks/use-require-ops';
export {
  TEACHER_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  OPS_ROLE_TYPE,
} from './constants/role.constants';
export { PARENT_ROLE_TYPE } from './constants/hooks.constants';
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
export { forgotPasswordSchema, type ForgotPasswordInput } from './schemas/forgot-password.schema';
export { useForgotPasswordMutation } from './queries/use-forgot-password.mutation';
export { resetPasswordSchema, type ResetPasswordInput } from './schemas/reset-password.schema';
export { useResetPasswordMutation } from './queries/use-reset-password.mutation';
export { useResendConfirmationMutation } from './queries/use-resend-confirmation.mutation';
export { changePasswordSchema, type ChangePasswordInput } from './schemas/change-password.schema';
export { useChangePasswordMutation } from './queries/use-change-password.mutation';
export { useMfaVerifyMutation } from './queries/use-mfa-verify.mutation';
export { useMfaStatusQuery, MFA_STATUS_QUERY_KEY } from './queries/use-mfa-status.query';
export {
  useMfaEnrolStartMutation,
  useMfaEnrolConfirmMutation,
} from './queries/use-mfa-enrol.mutation';
export { useMfaEnrol, type MfaEnrolPhase, type MfaEnrolFailure } from './hooks/use-mfa-enrol';
export { classifyMfaError } from './lib/classify-mfa-error';
export {
  mfaVerifyRequestSchema,
  mfaVerifyResponseSchema,
  mfaStatusResponseSchema,
  mfaEnrolStartRequestSchema,
  mfaEnrolStartResponseSchema,
  mfaEnrolConfirmRequestSchema,
  mfaEnrolConfirmResponseSchema,
  type MfaVerifyInput,
  type MfaStatusResponse,
  type MfaEnrolStartResponse,
  type MfaEnrolSecretResponse,
  type MfaEnrolConfirmResponse,
} from './schemas/mfa.schema';
export type {
  MfaVerifyErrorKey,
  MfaVerifyFailure,
  MfaVerifyResponse,
  MfaFactorMode,
} from './types/mfa.types';
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
  ParentRelationship,
  PreferredContactMethod,
} from './types/auth.types';
