export interface UseUpdateMeMutationOptions {
  // Receives the server's 400 details.fields so the form can mark those inputs.
  onInvalidFields?: (fields: string[]) => void;
}
