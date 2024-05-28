import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import AuthSignInRequestDto from './dto/request/auth-sign-in-request.dto';
import AuthSignUpRequestDto from './dto/request/auth-sign-up-request.dto';
import { IsPublic } from './decorator';
import { AppException, ERROR_CODE } from '../exceptions';
import AuthCasSignInRequestDto from './dto/request/auth-cas-sign-in-request.dto';
import AuthCasSignUpRequestDto from './dto/request/auth-cas-sign-up-request.dto';
import UsersService from '../users/users.service';
import { ApiBody, ApiCreatedResponse, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import AccessTokenResponse from './dto/response/auth-access-token-response.dto';
import TokenValidityResponseDto from './dto/response/token-validity-response.dto';
import CasLoginResponseDto from './dto/response/cas-login-response.dto';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @IsPublic()
  @Post('signup')
  @ApiOperation({
    description: 'Signs up the user, and returns an authentication token. This token should be used as a Bearer token.',
  })
  @ApiBody({ type: AuthSignUpRequestDto })
  @ApiCreatedResponse({
    description: 'The account was created successfully, the user is now authenticated and the token is returned.',
    type: AccessTokenResponse,
  })
  async signup(@Body() dto: AuthSignUpRequestDto): Promise<AccessTokenResponse> {
    const token = await this.authService.signup(dto);
    return { access_token: token };
  }

  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @Post('signin')
  @ApiOperation({
    description: 'Signs in the user, and returns an authentication token. This token should be used as a Bearer token.',
  })
  @ApiBody({ type: AuthSignInRequestDto })
  @ApiCreatedResponse({
    description: 'The user was successfully authenticated, the token is returned.',
    type: AccessTokenResponse,
  })
  async signin(@Body() dto: AuthSignInRequestDto) {
    const token = await this.authService.signin(dto);
    return { access_token: token };
  }

  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @Get('signin')
  @ApiOperation({
    description: 'Checks if the user is signed in. It returns a boolean indicating if the user is signed in.',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'The token should be passed as a Bearer token, as if the user was signed in.',
    required: true,
  })
  @ApiCreatedResponse({
    description: 'The user is signed in.',
    type: TokenValidityResponseDto,
  })
  isSignedIn(@Headers() headers: Record<string, string>): TokenValidityResponseDto {
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
  @ApiOperation({
    description:
      'Signs in the user using CAS, and returns an authentication token. This token should be used as a Bearer token.',
  })
  @ApiCreatedResponse({
    description:
      'The CAS ticket was successfully validated. If signedIn is true, the user is authenticated and can use the access_token to authenticate his requests. If signedIn is false, the user should use the access_token to sign up with "POST /auth/signup/cas".',
    type: AccessTokenResponse,
  })
  async casSignIn(@Body() dto: AuthCasSignInRequestDto): Promise<CasLoginResponseDto> {
    const res = await this.authService.casSignIn(dto.service, dto.ticket);
    if (res.status === 'invalid') {
      throw new AppException(ERROR_CODE.INVALID_CAS_TICKET);
    }
    return { signedIn: res.status === 'ok', access_token: res.token };
  }

  @IsPublic()
  @Post('signup/cas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    description:
      'Signs up the user using CAS, and returns an authentication token. This token should be used as a Bearer token.',
  })
  async casSignUp(@Body() dto: AuthCasSignUpRequestDto) {
    const data = this.authService.decodeRegisterToken(dto.registerToken);
    if (!data) throw new AppException(ERROR_CODE.INVALID_TOKEN_FORMAT);
    if (await this.usersService.doesUserExist({ login: data.login })) {
      throw new AppException(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    }
    const token = await this.authService.signup({ ...data, type: 'STUDENT' });
    return { access_token: token };
  }
}
