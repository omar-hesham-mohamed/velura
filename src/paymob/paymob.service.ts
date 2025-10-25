import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class PaymobService {
  private readonly baseUrl = 'https://accept.paymobsolutions.com/api/'; // change back to live
  private readonly apiKey: string;
  private readonly walletIntegrationId: number; 
  private readonly hmacSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('PAYMOB_API_KEY')!;
    this.walletIntegrationId = Number(this.configService.get<number>('PAYMOB_WALLET_INTEGRATION_ID'));
    this.hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET')!;
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

  /** Step 3: Generate a payment key for wallet payments */
  async generatePaymentKey(
    token: string,
    orderId: number,
    amountCents: number,
    billingData: Record<string, any>,
  ): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/acceptance/payment_keys`, {
        auth_token: token,
        amount_cents: amountCents.toString(),
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: this.walletIntegrationId,
      }),
    );
    return response.data.token;
  }

  /** Step 4: Generate wallet payment URL */
  async generateWalletPayment(
    paymentToken: string,
    walletType: 'vodafone' | 'orange' | 'etisalat' = 'vodafone',
  ): Promise<{ walletUrl: string; referenceNumber: string }> {
    // For wallet payments, generate the wallet-specific URL
    const walletUrl = this.getWalletUrl(paymentToken, walletType);

    // Generate a reference number (you can use timestamp or UUID)
    const referenceNumber = `WALLET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      walletUrl,
      referenceNumber,
    };
  }

  /** Get wallet-specific URL */
  private getWalletUrl(paymentToken: string, walletType: string): string {
    // For wallet payments, redirect to PayMob's wallet payment page
    const baseUrl = `https://accept.paymob.com/api/acceptance/iframes/`;
    
    switch (walletType) {
      case 'vodafone':
        return `${baseUrl}?payment_token=${paymentToken}&wallet=vodafone`;
      case 'orange':
        return `${baseUrl}?payment_token=${paymentToken}&wallet=orange`;
      case 'etisalat':
        return `${baseUrl}?payment_token=${paymentToken}&wallet=etisalat`;
      default:
        return `${baseUrl}?payment_token=${paymentToken}`;
    }
  }

  /** Verify HMAC signature for webhook security */
  verifyHmacSignature(data: any, signature: string): boolean {
    if (!this.hmacSecret || !signature) {
      return false;
    }

    try {
      // Create HMAC hash using the secret and request body
      const hmac = crypto.createHmac('sha256', this.hmacSecret);
      hmac.update(JSON.stringify(data));
      const calculatedSignature = hmac.digest('hex');
      
      // Compare signatures using crypto.timingSafeEqual to prevent timing attacks
      const providedSignature = Buffer.from(signature, 'hex');
      const expectedSignature = Buffer.from(calculatedSignature, 'hex');
      
      return crypto.timingSafeEqual(providedSignature, expectedSignature);
    } catch (error) {
      console.error('HMAC verification error:', error);
      return false;
    }
  }
}
