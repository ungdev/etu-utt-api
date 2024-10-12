export default class CasLoginResDto {
  status: 'no_account' | 'no_api_key' | 'ok';
  access_token: string;
}
