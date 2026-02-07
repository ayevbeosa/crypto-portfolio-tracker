import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>(
      'notifications.email.enabled',
      true,
    );

    if (this.enabled) {
      this.initializeTransporter();
    } else {
      this.logger.warn('Email notifications are disabled in configuration');
    }
  }

  private initializeTransporter() {
    const config = {
      host: this.configService.get<string>(
        'notifications.email.host',
        'smtp.gmail.com',
      ),
      port: this.configService.get<number>('notifications.email.port', 587),
      secure: this.configService.get<boolean>(
        'notifications.email.secure',
        false,
      ),
      auth: {
        user: this.configService.get<string>('notifications.email.user'),
        pass: this.configService.get<string>('notifications.email.password'),
      },
    };

    // If no credentials provided, use test account (Ethereal for development)
    if (!config.auth.user || !config.auth.pass) {
      this.logger.warn(
        'No email credentials configured. Use SMTP_USER and SMTP_PASSWORD env vars for production.',
      );
      this.enabled = false;
      return;
    }

    this.transporter = nodemailer.createTransport(config);

    // Verify connection
    this.transporter
      .verify()
      .then(() => {
        this.logger.log('Email service initialized successfully');
      })
      .catch((error) => {
        this.logger.error('Failed to initialize email service', error.stack);
        this.enabled = false;
      });
  }

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(
        `Email not sent (service disabled): ${payload.subject}`,
      );
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>(
          'notifications.email.from',
          '"Crypto Portfolio Tracker" <noreply@cryptoportfolio.com>',
        ),
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html || this.generateHtml(payload.text),
      });

      this.logger.log(`Email sent to ${payload.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}`, error.stack);
      return false;
    }
  }

  async sendPriceAlert(
    email: string,
    symbol: string,
    condition: string,
    targetPrice: number,
    currentPrice: number,
    message?: string,
  ): Promise<boolean> {
    const subject = `🔔 Price Alert: ${symbol} ${condition} $${targetPrice.toFixed(2)}`;
    const text =
      message ||
      this.generatePriceAlertText(symbol, condition, targetPrice, currentPrice);
    const html = this.generatePriceAlertHtml(
      symbol,
      condition,
      targetPrice,
      currentPrice,
      message,
    );

    return this.sendEmail({ to: email, subject, text, html });
  }

  async sendPortfolioUpdate(
    email: string,
    portfolioName: string,
    totalValue: number,
    profitLoss: number,
    profitLossPercentage: number,
  ): Promise<boolean> {
    const subject = `📊 Portfolio Update: ${portfolioName}`;
    const text = this.generatePortfolioUpdateText(
      portfolioName,
      totalValue,
      profitLoss,
      profitLossPercentage,
    );
    const html = this.generatePortfolioUpdateHtml(
      portfolioName,
      totalValue,
      profitLoss,
      profitLossPercentage,
    );

    return this.sendEmail({ to: email, subject, text, html });
  }

  async sendTestEmail(email: string, message?: string): Promise<boolean> {
    const subject = '✅ Test Notification from Crypto Portfolio Tracker';
    const text =
      message ||
      'This is a test email notification. Email notifications are working correctly!';

    return this.sendEmail({ to: email, subject, text });
  }

  private generatePriceAlertText(
    symbol: string,
    condition: string,
    targetPrice: number,
    currentPrice: number,
  ): string {
    return `
Price Alert Triggered!

Cryptocurrency: ${symbol}
Condition: ${condition}
Target Price: $${targetPrice.toFixed(2)}
Current Price: $${currentPrice.toFixed(2)}

Your alert has been triggered. Log in to view your portfolio and manage alerts.
    `.trim();
  }

  private generatePriceAlertHtml(
    symbol: string,
    condition: string,
    targetPrice: number,
    currentPrice: number,
    customMessage?: string,
  ): string {
    const priceChange = ((currentPrice - targetPrice) / targetPrice) * 100;
    const changeColor = priceChange >= 0 ? '#10b981' : '#ef4444';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
    .price { font-size: 32px; font-weight: bold; color: ${changeColor}; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Price Alert Triggered!</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2>${symbol}</h2>
        <p><strong>Condition:</strong> ${condition}</p>
        <p><strong>Target Price:</strong> $${targetPrice.toFixed(2)}</p>
        <p><strong>Current Price:</strong> <span class="price">$${currentPrice.toFixed(2)}</span></p>
        ${customMessage ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;"><em>${customMessage}</em></p>` : ''}
      </div>
      <p>Your price alert has been triggered. You can view your portfolio and manage your alerts by logging in.</p>
      <a href="${this.configService.get('app.url', 'http://localhost:3000')}" class="button">View Portfolio</a>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private generatePortfolioUpdateText(
    portfolioName: string,
    totalValue: number,
    profitLoss: number,
    profitLossPercentage: number,
  ): string {
    return `
Portfolio Update: ${portfolioName}

Current Value: $${totalValue.toFixed(2)}
Profit/Loss: $${profitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)

Log in to view detailed portfolio performance.
    `.trim();
  }

  private generatePortfolioUpdateHtml(
    portfolioName: string,
    totalValue: number,
    profitLoss: number,
    profitLossPercentage: number,
  ): string {
    const isProfit = profitLoss >= 0;
    const color = isProfit ? '#10b981' : '#ef4444';
    const emoji = isProfit ? '📈' : '📉';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .stat-item { margin: 15px 0; padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .stat-value { font-size: 24px; font-weight: bold; color: ${color}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Portfolio Update</h1>
    </div>
    <div class="content">
      <h2>${portfolioName}</h2>
      <div class="stats">
        <div class="stat-item">
          <p><strong>Current Value</strong></p>
          <p class="stat-value">$${totalValue.toFixed(2)}</p>
        </div>
        <div class="stat-item">
          <p><strong>Profit/Loss ${emoji}</strong></p>
          <p class="stat-value">${isProfit ? '+' : ''}$${profitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)</p>
        </div>
      </div>
      <a href="${this.configService.get('app.url', 'http://localhost:3000')}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Full Portfolio</a>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private generateHtml(text: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    ${text
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('')}
  </div>
</body>
</html>
    `.trim();
  }
}
