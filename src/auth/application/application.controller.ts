import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import ApplicationResDto from './dto/res/application-res.dto';
import { ApiOperation } from '@nestjs/swagger';
import ApplicationService from './application.service';
import { GetUser, IsPublic } from '../decorator';
import { Application } from './interfaces/application.interface';
import CreateApplicationReqDto from './dto/req/create-application-req.dto';
import UpdateTokenReqDto from './dto/req/update-token-req.dto';
import { hasPermissionOnUser, pick } from '../../utils';
import AuthTokenResDto from '../dto/res/auth-token-res.dto';
import { GetPermissions } from '../decorator/get-permissions.decorator';
import { RequestPermissions } from '../interfaces/request-auth-data.interface';
import { AppException, ERROR_CODE } from '../../exceptions';
import { Permission } from '@prisma/client';
import ApplicationClientSecretResDto from './dto/res/application-client-secret-res.dto';
import { ApiAppErrorResponse } from '../../app.dto';
import ApplicationSensibleResDto from './dto/res/application-sensible-res.dto';

@Controller('auth/application')
export default class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Get('/of/me')
  @ApiOperation({ description: 'Get the applications of the user issuing the request.' })
  async getMyApplications(@GetUser('id') userId: string): Promise<ApplicationResDto[]> {
    return this.getApplicationsOf(userId, { [Permission.USER_SEE_DETAILS]: '*' });
  }

  @Get('/of/:userId')
  @ApiOperation({ description: 'Get the applications of specified user.' })
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_NOT_ENOUGH_USER_PERMISSIONS,
    'User issuing the request does not have the USER_SEE_DETAILS for the specified user.',
  )
  async getApplicationsOf(
    @Param('userId') userId: string,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<ApplicationResDto[]> {
    if (!hasPermissionOnUser(Permission.USER_SEE_DETAILS, userId, permissions))
      throw new AppException(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_USER_PERMISSIONS, 'USER_SEE_DETAILS', userId);
    const applications = await this.applicationService.getFromUserId(userId);
    return applications.map(this.formatApplicationOverview);
  }

  @IsPublic()
  @Get('/:applicationId')
  @ApiOperation({ description: 'Get the application with the given id.' })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_APPLICATION, 'Application does not exist.')
  async getApplication(@Param('applicationId') applicationId: string): Promise<ApplicationResDto> {
    const application = await this.applicationService.get(applicationId);
    if (!application) throw new AppException(ERROR_CODE.NO_SUCH_APPLICATION, applicationId);
    return this.formatApplicationOverview(application);
  }

  @Post()
  @ApiOperation({ description: 'Creates a new application owned by the user issuing the request.' })
  async createApplication(
    @GetUser('id') userId: string,
    @Body() dto: CreateApplicationReqDto,
  ): Promise<ApplicationResDto> {
    const application = await this.applicationService.createApplication(userId, dto.name, dto.redirectUrl);
    return this.formatApplicationSensible(application);
  }

  @Patch('/:applicationId/client-secret')
  @ApiOperation({
    description:
      'Generates a new client secret and returns it. The new client secret will never be returned again, it will need to be regenerated.',
  })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_APPLICATION, 'The application does not exist.')
  async generateClientSecret(
    @Param('applicationId') applicationId: string,
    @GetUser('id') userId,
  ): Promise<ApplicationClientSecretResDto> {
    const application = await this.applicationService.get(applicationId);
    if (!application) throw new AppException(ERROR_CODE.NO_SUCH_APPLICATION, applicationId);
    if (application.owner.id !== userId) throw new AppException(ERROR_CODE.APPLICATION_NOT_OWNED, applicationId);
    const clientSecret = await this.applicationService.regenerateClientSecret(applicationId);
    return { clientSecret };
  }

  @Patch('/:applicationId/token')
  @ApiOperation({ description: 'Generates a new token that can be used to log in as the owner with the application.' })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_APPLICATION, 'The application does not exist.')
  async generateToken(
    @GetUser('id') userId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateTokenReqDto,
  ): Promise<AuthTokenResDto> {
    const application = await this.applicationService.get(applicationId);
    if (!application) throw new AppException(ERROR_CODE.NO_SUCH_APPLICATION, applicationId);
    if (application.owner.id !== userId) throw new AppException(ERROR_CODE.APPLICATION_NOT_OWNED, applicationId);
    const token = await this.applicationService.regenerateApiKeyToken(userId, applicationId, dto.expiresIn);
    return { token };
  }

  private formatApplicationOverview(application: Application): ApplicationResDto {
    return {
      ...pick(application, 'id', 'name', 'redirectUrl'),
      owner: pick(application.owner, 'id', 'firstName', 'lastName'),
    };
  }

  private formatApplicationSensible(application: Application): ApplicationSensibleResDto {
    return {
      ...pick(application, 'id', 'name', 'redirectUrl', 'clientSecret'),
      owner: pick(application.owner, 'id', 'firstName', 'lastName'),
    };
  }
}
