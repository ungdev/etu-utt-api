import { IsPublic } from './decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppException, ERROR_CODE } from '../exceptions';
import { ApiAppErrorResponse } from '../app.dto';
import AuthSignUpDebugReqDto from './dto/req/auth-sign-up-debug-req.dto';
import { GetApplication } from './decorator/get-application.decorator';
import { Application } from './application/interfaces/application.interface';
import AuthSignInDebugResDto from './dto/res/auth-sign-in-debug-res.dto';
import AuthSignInDebugReqDto from './dto/req/auth-sign-in-debug-req.dto';
import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';
import ApplicationService from './application/application.service';

@Controller({ path: 'auth', version: 'dev' })
export class AuthDebugController {
  constructor(private authService: AuthService, private config: ConfigService, private applicationService: ApplicationService) {
  }

  @IsPublic()
  @Post('signup')
  @ApiOperation({
    description: 'Signs up the user, and returns an authentication token. This token should be used as a Bearer token.',
  })
  @ApiCreatedResponse({
    description: 'The account was created successfully, the user is now authenticated and the token is returned.',
    type: AuthSignInDebugResDto,
  })
  @ApiAppErrorResponse(
    ERROR_CODE.CREDENTIALS_ALREADY_TAKEN,
    'Login, email address or any field that should be unique is already taken',
  )
  async debugSignUp(@Body() dto: AuthSignUpDebugReqDto, @GetApplication() application: Application): Promise<AuthSignInDebugResDto> {
    const token = await this.authService.signUp(dto, application.id, false, dto.tokenExpiresIn);
    const redirectUrl = `${application.redirectUrl}/${token}`;
    return { signedIn: true, token, redirectUrl };
  }

  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @Post('signin')
  @ApiOperation({
    description: 'Signs in the user, and returns an authentication token. This token should be used as a Bearer token.',
  })
  @ApiOkResponse({
    description: 'The user was successfully authenticated, the token is returned.',
    type: AuthSignInDebugResDto,
  })
  @ApiAppErrorResponse(ERROR_CODE.INVALID_CREDENTIALS, 'Either the login or the password is incorrect')
  async debugSignIn(@Body() dto: AuthSignInDebugReqDto, @GetApplication() application: Application): Promise<AuthSignInDebugResDto> {
    const res = await this.authService.signInFromLogin(dto.login, application.id);
    if (!res) throw new AppException(ERROR_CODE.INVALID_CREDENTIALS);
    if (!res.apiKey)
      return {
        signedIn: false,
        token: await this.authService.signRegisterApiKeyToken(res.userId, application.id, dto.tokenExpiresIn),
        redirectUrl: null,
      };
    if (application.id === this.config.ETUUTT_WEBSITE_APPLICATION_ID)
      return {
        signedIn: true,
        token: await this.authService.signApiKey(res.apiKey.id, dto.tokenExpiresIn),
        redirectUrl: null,
      };
    const token = await this.authService.signValidationToken(res.apiKey.id, application.id, dto.tokenExpiresIn);
    return {
      signedIn: true,
      token: null,
      redirectUrl: this.applicationService.formatRedirectUrl(application, token),
    };
  }
}