export default class CasSignInResDto {
  status: 'no_account' | 'no_api_key' | 'ok';
  token: string | null;
  redirectUrl: string | null;
}
