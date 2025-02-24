import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import ApplicationResDto from './dto/res/application-res.dto';
import { ApiBody, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import ApplicationService from './application.service';
import {GetUser, IsPublic} from '../decorator';
import { Application } from './interfaces/application.interface';
import CreateApplicationReqDto from './dto/req/create-application-req.dto';
import { AuthService } from '../auth.service';
import UpdateTokenReqDto from './dto/req/update-token-req.dto';
import { pick } from '../../utils';
import AuthTokenResDto from '../dto/res/auth-token-res.dto';

@Controller('auth/application')
export default class ApplicationController {
  constructor(private applicationService: ApplicationService, private authService: AuthService) {}

  @Get()
  @ApiOkResponse({ type: ApplicationResDto, isArray: true })
  async getMyApplications(@GetUser('id') userId: string): Promise<ApplicationResDto[]> {
    const applications = await this.applicationService.getFromUserId(userId);
    return applications.map(this.formatApplicationOverview);
  }

  @Get('/:applicationId')
  @ApiOkResponse({ type: ApplicationResDto })
  @IsPublic()
  async getApplication(@Param('applicationId') applicationId: string): Promise<ApplicationResDto> {
    const application = await this.applicationService.get(applicationId);
    return this.formatApplicationOverview(application);
  }

  @Post()
  @ApiCreatedResponse({ type: ApplicationResDto })
  async createApplication(
    @GetUser('id') userId: string,
    @Body() dto: CreateApplicationReqDto,
  ): Promise<ApplicationResDto> {
    const application = await this.applicationService.createApplication(userId, dto.name, dto.redirectUrl);
    return this.formatApplicationOverview(application);
  }

  @Patch('/:applicationId/token')
  @ApiBody({ type: UpdateTokenReqDto })
  @ApiOkResponse({ type: AuthTokenResDto, isArray: true })
  async generateToken(
    @GetUser('id') userId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateTokenReqDto,
  ): Promise<AuthTokenResDto> {
    const token = await this.applicationService.regenerateApiKeyToken(userId, applicationId, dto.expiresIn);
    return { token };
  }

  private formatApplicationOverview(application: Application): ApplicationResDto {
    return pick(application, 'id', 'name', 'userId', 'redirectUrl');
  }
}
