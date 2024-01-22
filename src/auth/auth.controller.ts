import { Body, Controller, Get, HttpCode, HttpStatus, Post, Headers, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSignInDto, AuthSignUpDto } from './dto';
import { IsPublic } from './decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @IsPublic()
  @Post('signup')
  async signup(@Body() dto: AuthSignUpDto) {
    const token = await this.authService.signup(dto);
    return { access_token: token };
  }

  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @Post('signin')
  async signin(@Body() dto: AuthSignInDto) {
    const token = await this.authService.signin(dto);
    return { access_token: token };
  }

  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @Get('signin')
  isSignedIn(@Headers() headers: Record<string, string>) {
    const authorizationHeader = headers['authorization'];
    if (!authorizationHeader) {
      throw new BadRequestException('No token provided');
    }
    const match = new RegExp(/^Bearer\s+(.*)$/).exec(authorizationHeader);
    if (!match) {
      throw new BadRequestException('Token format is invalid');
    }
    return { valid: this.authService.isTokenValid(match[1]) };
  }
}
