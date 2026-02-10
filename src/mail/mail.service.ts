import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) {}

  private async send(to: string, subject: string, template: string, templateVariables: Record<string, any>) {
    const sendMailParams: ISendMailOptions = {
      to,
      subject,
      template,
      context: templateVariables,
    };
    try {
      await this.mailerService.sendMail(sendMailParams);
      this.logger.log('Email sent successfully to recipient');
    } catch (error) {
      this.logger.error(
        `Error while sending mail with the following parameters : ${JSON.stringify(sendMailParams)}`,
        error,
      );
    }
  }
}
