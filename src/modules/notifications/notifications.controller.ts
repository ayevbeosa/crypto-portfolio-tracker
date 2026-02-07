import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesResponseDto } from './dtos/notification-preferences-response.dto';
import {
  CurrentUser,
  type CurrentUserData,
} from '@/common/decorators/current-user.decorator';
import { UpdateNotificationPreferencesDto } from './dtos/update-notification-preferences.dto';
import { AddPushTokenDto } from './dtos/add-push-token.dto';
import { SendTestNotificationDto } from './dtos/send-test-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
    type: NotificationPreferencesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: NotificationPreferencesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, dto);
  }

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a push notification token' })
  @ApiResponse({
    status: 200,
    description: 'Push token registered successfully',
    type: NotificationPreferencesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addPushToken(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddPushTokenDto,
  ) {
    return this.notificationsService.addPushToken(user.id, dto.token);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test notification' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - channel not configured',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendTest(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendTestNotificationDto,
  ) {
    const success = await this.notificationsService.sendTestNotification(
      user.id,
      dto.channel,
      dto.message,
    );

    return {
      success,
      message: success
        ? `Test ${dto.channel} notification sent successfully`
        : `Failed to send test ${dto.channel} notification`,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.getNotificationStats(user.id);
  }
}
