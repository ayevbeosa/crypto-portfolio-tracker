import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertsMonitorService } from './alerts-monitor.service';
import { AlertResponseDto } from './dtos/alert-response.dto';
import {
  CurrentUser,
  type CurrentUserData,
} from '@/common/decorators/current-user.decorator';
import { CreateAlertDto } from './dtos/create-alert.dto';
import { AlertStatus } from '@/database/entities/alert.entity';
import { AlertStatsDto } from './dtos/alert-stats.dto';
import { UpdateAlertDto } from './dtos/update-alert.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly alertsMonitorService: AlertsMonitorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new price alert' })
  @ApiResponse({
    status: 201,
    description: 'Alert created successfully',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or duplicate alert',
  })
  @ApiResponse({ status: 404, description: 'Cryptocurrency not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    const alert = await this.alertsService.create(user.id, createAlertDto);
    return this.alertsService.toResponseDto(alert);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user alerts' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AlertStatus,
    description: 'Filter by alert status',
  })
  @ApiResponse({
    status: 200,
    description: 'Alerts retrieved successfully',
    type: [AlertResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: AlertStatus,
  ) {
    const alerts = await this.alertsService.findAll(user.id, status);
    return Promise.all(
      alerts.map((alert) => this.alertsService.toResponseDto(alert)),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: AlertStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser() user: CurrentUserData) {
    return this.alertsService.getStats(user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active alerts' })
  @ApiResponse({
    status: 200,
    description: 'Active alerts retrieved successfully',
    type: [AlertResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActive(@CurrentUser() user: CurrentUserData) {
    const alerts = await this.alertsService.findAll(
      user.id,
      AlertStatus.ACTIVE,
    );
    return Promise.all(
      alerts.map((alert) => this.alertsService.toResponseDto(alert)),
    );
  }

  @Get('triggered')
  @ApiOperation({ summary: 'Get all triggered alerts' })
  @ApiResponse({
    status: 200,
    description: 'Triggered alerts retrieved successfully',
    type: [AlertResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTriggered(@CurrentUser() user: CurrentUserData) {
    const alerts = await this.alertsService.findAll(
      user.id,
      AlertStatus.TRIGGERED,
    );
    return Promise.all(
      alerts.map((alert) => this.alertsService.toResponseDto(alert)),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Alert retrieved successfully',
    type: AlertResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const alert = await this.alertsService.findOne(id, user.id);
    return this.alertsService.toResponseDto(alert);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Alert updated successfully',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or cannot update',
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    const alert = await this.alertsService.update(id, user.id, updateAlertDto);
    return this.alertsService.toResponseDto(alert);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.alertsService.remove(id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active alert' })
  @ApiParam({ name: 'id', description: 'Alert ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Alert cancelled successfully',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Only active alerts can be cancelled',
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const alert = await this.alertsService.cancel(id, user.id);
    return this.alertsService.toResponseDto(alert);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger alert checking' })
  @ApiResponse({
    status: 200,
    description: 'Alert check triggered successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async triggerCheck() {
    const triggeredCount = await this.alertsMonitorService.triggerCheck();
    return {
      message: 'Alert check completed',
      triggeredCount,
    };
  }
}
