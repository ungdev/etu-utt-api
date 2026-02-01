import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '../config/config.module';
import { MailController } from './mail.controller';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigModule],
      useFactory: async (config: ConfigModule) => {
        return {
          transport: {
            requireTLS: true,
            tls: {
              rejectUnauthorized: false,
            },
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            auth: {
              user: config.SMTP_USER,
              pass: config.SMTP_PASSWORD,
            },
            name: 'EtuUTT',
          },
          template: {
            adapter: new EjsAdapter(),
            dir: 'template/',
            options: { strict: true },
          },
          defaults: {
            from: {
              name: 'EtuUTT',
              address: 'etuutt@utt.fr',
            },
          },
        };
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
