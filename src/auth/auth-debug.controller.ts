import { IsPublic } from '@/auth/decorator/index.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppException, ERROR_CODE } from '@/exceptions.js';
import { ApiAppErrorResponse } from '@/app.dto.js';
import AuthSignUpDebugReqDto from '@/auth/dto/req/auth-sign-up-debug-req.dto.js';
import { GetApplication } from '@/auth/decorator/get-application.decorator.js';
import { Application } from '@/auth/application/interfaces/application.interface.js';
import AuthSignInDebugResDto from '@/auth/dto/res/auth-sign-in-debug-res.dto.js';
import { AuthSignInDebugReqDto } from '@/auth/dto/req/auth-sign-in-debug-req.dto.js';
import { AuthService } from '@/auth/auth.service.js';
import { ConfigService } from '@/config/config.service.js';
import { ApplicationService } from '@/auth/application/application.service.js';

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
    const { userId, token } = await this.authService.signUp(dto, application.id, false, dto.tokenExpiresIn);
    await this.authService.modifyUserType(userId, dto.userType);
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