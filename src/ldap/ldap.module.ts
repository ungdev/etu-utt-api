import { Injectable, Module } from '@nestjs/common';
import { Client as LdapClient } from 'ldapts';
import { ConfigModule } from '../config/config.module';
import { LdapAccountGroup, LdapUser } from './ldap.interface';

@Module({
  exports: [LdapModule],
})
@Injectable()
export class LdapModule {
  constructor(private config: ConfigModule) {}

  async fetch(user: string): Promise<LdapUser | null> {
    if (!this.config.LDAP_URL) {
      return null;
    }
    // Connect to LDAP Server
    const ldapClient = new LdapClient({
      url: this.config.LDAP_URL,
      timeout: 1000,
    });
    // Authenticate the connection
    if (this.config.LDAP_USER && this.config.LDAP_PWD)
      await ldapClient.bind(this.config.LDAP_USER, this.config.LDAP_PWD);
    // Search User in LDAP
    const {
      searchEntries: [ldapUser],
    } = await ldapClient.search('ou=people,dc=utt,dc=fr', {
      filter: `(uid=${user.replaceAll(/[^A-Za-z1-9]/g, '')})`,
    });
    ldapClient.unbind();
    return ldapUser as unknown as LdapUser;
  }
}
