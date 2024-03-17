import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, RegisterData } from './auth.service';
import { AuthSignInDto, AuthSignUpDto } from './dto';
import { IsPublic } from './decorator';
import { AppException, ERROR_CODE } from '../exceptions';
import AuthCasSignInDto from './dto/auth-cas-sign-in.dto';
import { AuthCasSignUpDto } from './dto/auth-cas-sign-up.dto';
import UsersService from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

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
      throw new AppException(ERROR_CODE.NO_TOKEN);
    }
    const match = new RegExp(/^Bearer\s+(.*)$/).exec(authorizationHeader);
    if (!match) {
      throw new AppException(ERROR_CODE.INVALID_TOKEN_FORMAT);
    }
    return { valid: this.authService.isTokenValid(match[1]) };
  }

  @IsPublic()
  @Post('signin/cas')
  @HttpCode(HttpStatus.OK)
  async casSignIn(@Body() dto: AuthCasSignInDto) {
    const res = await this.authService.casSignIn(dto.service, dto.ticket);
    if (res.status === 'invalid') {
      throw new AppException(ERROR_CODE.INVALID_CAS_TICKET);
    }
    return { signedIn: res.status === 'ok', access_token: res.token };
  }

  @IsPublic()
  @Post('signup/cas')
  @HttpCode(HttpStatus.CREATED)
  async casSignUp(@Body() dto: AuthCasSignUpDto) {
    const data = this.authService.decodeRegisterToken(dto.registerToken);
    if (!data) throw new AppException(ERROR_CODE.INVALID_TOKEN_FORMAT);
    if (await this.usersService.doesUserExist({ login: data.login }))
      throw new AppException(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    const token = await this.authService.signup({ ...data, role: 'STUDENT' });
    return { access_token: token };
  }
}
