
import { Invoice, StripeConnection } from '../types';

interface PaymentMethod {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

interface FinancialResult {
  base: number;
  taxAmount: number;
  total: number;
  taxRate: number;
}

// SIMULATED STRIPE BACKEND
export const stripeService = {
  
  // Calculate Base + Tax
  calculateFinancials: (baseAmount: number, taxRate: number = 21): FinancialResult => {
    const taxAmount = baseAmount * (taxRate / 100);
    const total = baseAmount + taxAmount;
    return {
      base: parseFloat(baseAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      taxRate
    };
  },

  // 1. CREATE CUSTOMER & PAYMENT METHOD
  createCustomer: async (email: string, name: string, paymentMethod: PaymentMethod): Promise<{ customerId: string, last4: string, brand: string }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!paymentMethod.number || paymentMethod.number.length < 12) {
          reject("Número de tarjeta inválido.");
          return;
        }
        
        // Simular validación de Luhn
        const last4 = paymentMethod.number.slice(-4);
        const brand = paymentMethod.number.startsWith('4') ? 'Visa' : 'MasterCard';
        
        resolve({
          customerId: `cus_${Math.random().toString(36).substr(2, 14)}`,
          last4,
          brand
        });
      }, 1500);
    });
  },

  // 2. PROCESS ONE-TIME PAYMENT (Charge)
  processPayment: async (
    customerId: string | undefined, 
    amount: number, 
    description: string,
    paymentMethod?: PaymentMethod
  ): Promise<{ success: boolean; transactionId: string; invoiceId: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // En un entorno real, usaría stripe.paymentIntents.create
        const success = Math.random() > 0.05; // 95% success rate simulation
        
        if (success) {
          resolve({
            success: true,
            transactionId: `ch_${Math.random().toString(36).substr(2, 18)}`,
            invoiceId: `in_${Math.random().toString(36).substr(2, 18)}`
          });
        } else {
          throw new Error("El banco ha rechazado la operación.");
        }
      }, 2000);
    });
  },

  // 3. CREATE SUBSCRIPTION
  createSubscription: async (customerId: string, priceId: string): Promise<{ subscriptionId: string; status: string; nextBilling: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        resolve({
          subscriptionId: `sub_${Math.random().toString(36).substr(2, 14)}`,
          status: 'active',
          nextBilling: nextMonth.toISOString().split('T')[0]
        });
      }, 1000);
    });
  },

  // 4. CONNECT ACCOUNT (OAuth Flow Simulation)
  connectAccount: async (email: string): Promise<StripeConnection> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'connected',
          accountId: `acct_${Math.random().toString(36).substr(2, 14)}`,
          lastSync: new Date().toISOString(),
          webhookStatus: 'active'
        });
      }, 2500);
    });
  },

  // 5. GET INVOICE PDF URL (Mock)
  getInvoiceUrl: (invoiceId: string) => {
    return `https://pay.stripe.com/invoice/${invoiceId}/pdf`;
  }
};
