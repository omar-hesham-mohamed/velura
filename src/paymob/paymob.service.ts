import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymobService {
  private readonly baseUrl = 'https://accept.paymob.com/api';
  private readonly apiKey: string;
  private readonly integrationId: number;
  private readonly iframeId: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('PAYMOB_API_KEY')!;
    this.integrationId = Number(this.configService.get<number>('PAYMOB_INTEGRATION_ID'));
    this.iframeId = Number(this.configService.get<number>('PAYMOB_IFRAME_ID'));
  }

  /** Step 1: Authenticate and get API token */
  async authenticate(): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/auth/tokens`, {
        api_key: this.apiKey,
      }),
    );
    return response.data.token;
  }

  /** Step 2: Create an order on Paymob */
  async createOrder(token: string, amountCents: number): Promise<number> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/ecommerce/orders`, {
        auth_token: token,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        items: [],
      }),
    );
    return response.data.id;
  }

  /** Step 3: Generate a payment key for the order */
  async generatePaymentKey(
    token: string,
    orderId: number,
    amountCents: number,
    billingData: Record<string, any>,
  ): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/acceptance/payment_keys`, {
        auth_token: token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: this.integrationId,
      }),
    );
    return response.data.token;
  }

  /** Step 4: Build the payment URL for frontend redirection */
  getPaymentUrl(paymentToken: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`;
  }
}
