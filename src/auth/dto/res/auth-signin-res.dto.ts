export class AuthSigninResDto {
  signedIn: boolean;
  token: string | null;
  redirectUrl: string | null;
}
