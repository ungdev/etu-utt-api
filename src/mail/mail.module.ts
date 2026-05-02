import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '../config/config.service';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          transport: {
            requireTLS: true,
            tls: {
              rejectUnauthorized: config.SMTP_REJECT_UNAUTHORIZED,
            },
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            auth: {
              user: config.SMTP_USER,
              pass: config.SMTP_PASSWORD,
            },
            name: config.SMTP_SERVER_NAME,
          },
          template: {
            adapter: new EjsAdapter(),
            dir: 'template/',
            options: { strict: true },
          },
          defaults: {
            from: {
              name: config.SMTP_SENDING_NAME,
              address: config.SMTP_SENDING_NAME,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
