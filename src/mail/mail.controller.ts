import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { IsPublic } from '../auth/decorator';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @IsPublic()
  @Get()
  async sendMail() {
    await this.mailService.sendConfirmAccountCreation('teddy.roncin@utt.fr');
    return {};
  }
}
