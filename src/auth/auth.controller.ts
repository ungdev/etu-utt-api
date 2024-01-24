import { BadRequestException, Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthSignInDto, AuthSignUpDto } from "./dto";
import { IsPublic } from "./decorator/public.decorator";
import { AppException, ERROR_CODE } from "../exceptions";

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
      throw new AppException(ERROR_CODE.NO_TOKEN);
    }
    const match = new RegExp(/^Bearer\s+(.*)$/).exec(authorizationHeader);
    if (!match) {
      throw new AppException(ERROR_CODE.INVALID_TOKEN_FORMAT);
    }
    return { valid: this.authService.isTokenValid(match[1]) };
  }
}
