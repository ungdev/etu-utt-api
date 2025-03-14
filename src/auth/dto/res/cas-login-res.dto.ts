export default class CasLoginResDto {
  status: 'no_account' | 'no_api_key' | 'ok';
  token: string | null;
  redirectUrl: string | null;
}
