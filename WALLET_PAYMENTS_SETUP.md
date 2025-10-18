# Wallet Payments Setup Guide

## 🎯 **For Wallet Payments Only**

Your code is now configured to accept **wallet payments only** (Vodafone Cash, Orange Money, Etisalat Cash).

## 🔧 **Required Environment Variables**

Update your `.env` file with these variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/velura"

# PayMob Configuration
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_WALLET_INTEGRATION_ID=your_wallet_integration_id
PAYMOB_HMAC_SECRET=your_hmac_secret
```

## 📋 **PayMob Dashboard Setup for Wallets**

### 1. **Create Wallet Integration**
1. Login to [PayMob Dashboard](https://dashboard.paymob.com)
2. Go to **Integrations** → **Create New**
3. Select **"Accept Wallet"** as integration type
4. Configure wallet settings:
   - **Vodafone Cash**: Enable
   - **Orange Money**: Enable  
   - **Etisalat Cash**: Enable
5. Save and note the **Integration ID**

### 2. **Get HMAC Secret**
1. Go to **Settings** → **Webhooks**
2. Copy the **HMAC Secret** (long string)

## 🚀 **API Usage Examples**

### **Create Order with Vodafone Cash Payment**
```json
POST /orders
{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "billingData": {
    "firstName": "Ahmed",
    "lastName": "Hassan",
    "email": "ahmed@example.com",
    "phoneNumber": "01000000000",
    "street": "123 Main St",
    "city": "Cairo",
    "country": "EG"
  },
  "walletType": "vodafone"
}
```

### **Response**
```json
{
  "order": { /* order details */ },
  "paymobOrderId": 12345,
  "paymentKey": "payment_key_here",
  "walletUrl": "https://accept.paymob.com/api/acceptance/iframes/?payment_token=...&wallet=vodafone",
  "referenceNumber": "ref_123456",
  "walletType": "vodafone"
}
```

### **Create Order with Orange Money Payment**
```json
POST /orders
{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 1
    }
  ],
  "billingData": {
    "firstName": "Sara",
    "lastName": "Mohamed",
    "email": "sara@example.com",
    "phoneNumber": "01200000000",
    "city": "Alexandria",
    "country": "EG"
  },
  "walletType": "orange"
}
```

## 🔄 **Payment Flow**

1. **User creates order** with wallet type
2. **Backend generates** wallet payment URL
3. **User redirects** to wallet URL
4. **User completes** payment in wallet app
5. **PayMob sends** webhook to your callback
6. **Order status** updates to PAID

## 📱 **Frontend Integration**

### **Redirect to Wallet**
```javascript
// After getting the response from /orders endpoint
const { walletUrl, referenceNumber } = response.data;

// Redirect user to wallet payment
window.location.href = walletUrl;

// Or show QR code for reference number
console.log('Reference Number:', referenceNumber);
```

## 🔔 **Webhook Configuration**

Set your webhook URL in PayMob dashboard:
- **Webhook URL**: `https://yourdomain.com/paymob/callback`
- **Events**: Payment Success, Payment Failure

## ✅ **Supported Wallets**

- ✅ **Vodafone Cash** (`walletType: "vodafone"`)
- ✅ **Orange Money** (`walletType: "orange"`)
- ✅ **Etisalat Cash** (`walletType: "etisalat"`)

## 🧪 **Testing**

1. **Test with PayMob Test Environment**
2. **Use test phone numbers** for wallet payments
3. **Check webhook callbacks** are received
4. **Verify order status** updates correctly

## 🚨 **Important Notes**

- **No iFrames**: Wallet payments don't use iFrames
- **Direct Redirect**: Users are redirected to wallet apps
- **Mobile First**: Wallet payments work best on mobile devices
- **Reference Numbers**: Keep track of reference numbers for customer support

Your backend is now ready for wallet payments only! 🎉
