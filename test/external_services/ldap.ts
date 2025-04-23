import { LdapServerMock, LdapUser } from 'ldap-server-mock';

export function mockLdapServer(list: LdapUser[]) {
  //console.log("loading server ", process.env.LDAP_URL)
  const ldapServer = new LdapServerMock(
    list,
    {
      searchBase: 'ou=people,dc=utt,dc=fr',
      port: Number(process.env.LDAP_URL.split(':')[2]),
    },
    null,
    null,
    {
      // Disable default logging
      info: () => undefined,
    },
  );

  beforeAll(async () => {
    await ldapServer.start();
  });
  afterAll(async () => {
    await ldapServer.stop();
  });
}
