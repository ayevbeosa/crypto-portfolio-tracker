import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WebSocketService } from './websocket.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Websocket')
@Controller('websocket')
export class WebsocketController {
  constructor(private readonly websocketService: WebSocketService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get WebSocket connection statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStats() {
    return this.websocketService.getStats();
  }

  @Post('announce')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast announcement to all connected clients' })
  @ApiResponse({
    status: 200,
    description: 'Announcement broadcasted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  broadcastAnnouncement(
    @Body() body: { message: string; type?: 'info' | 'warning' | 'error' },
  ) {
    this.websocketService.broadcastAnnouncement(body.message, body.type);
    return { message: 'Announcement broadcasted successfully' };
  }
}
