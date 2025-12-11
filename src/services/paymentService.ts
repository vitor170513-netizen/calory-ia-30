
import { UserProfile } from "../types";

export const PAYMENT_CONFIG = {
  SIMULATION_MODE: false, 
  STATIC_CHECKOUT_URL: 'https://mpago.la/1tyju6g', 
  API_BASE_URL: '', 
};

export interface PaymentOrder {
  orderId: string;
  qrCode?: string; 
  qrCodeImage?: string;
  checkoutUrl?: string;
  status: 'pending' | 'approved' | 'failed';
}

const generateSimulationOrder = async (method: 'pix' | 'card' | 'paypal'): Promise<PaymentOrder> => {
    await new Promise(r => setTimeout(r, 1500)); 

    return {
      orderId: `sim_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      checkoutUrl: '#' 
    };
};

export const createPaymentOrder = async (
  method: 'pix' | 'card' | 'paypal', 
  user: UserProfile | null,
  price: { value: string, code: string }
): Promise<PaymentOrder> => {
  
  if (PAYMENT_CONFIG.SIMULATION_MODE) {
    return generateSimulationOrder(method);
  }

  if (PAYMENT_CONFIG.STATIC_CHECKOUT_URL && 
      PAYMENT_CONFIG.STATIC_CHECKOUT_URL.length > 5) {
       return {
         orderId: `prod_${Date.now()}`,
         status: 'pending',
         checkoutUrl: PAYMENT_CONFIG.STATIC_CHECKOUT_URL
       };
  }

  if (PAYMENT_CONFIG.API_BASE_URL && PAYMENT_CONFIG.API_BASE_URL.length > 5) {
    try {
        const response = await fetch(`${PAYMENT_CONFIG.API_BASE_URL}/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            method,
            payer: { email: user?.email, name: user?.name },
            currency: price.code,
            amount: parseFloat(price.value.replace(',', '.'))
        })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                orderId: data.id,
                qrCode: data.point_of_interaction?.transaction_data?.qr_code,
                qrCodeImage: data.point_of_interaction?.transaction_data?.qr_code_base64,
                checkoutUrl: data.init_point,
                status: 'pending'
            };
        }
    } catch (error) {
        console.warn("Backend connection failed.", error);
    }
  }

  console.error("⚠️ ERRO CRÍTICO: Link de Pagamento não configurado em services/paymentService.ts");
  alert("Erro de Configuração: O link de pagamento não foi definido pelo administrador do site.");
  
  return {
      orderId: 'error',
      status: 'failed'
  };
};

export const checkPaymentStatus = async (orderId: string): Promise<'pending' | 'approved' | 'failed'> => {
  if (PAYMENT_CONFIG.API_BASE_URL) {
      try {
        const response = await fetch(`${PAYMENT_CONFIG.API_BASE_URL}/check-status/${orderId}`);
        const data = await response.json();
        return data.status === 'approved' ? 'approved' : 'pending';
      } catch (error) {
        return 'pending';
      }
  }

  return 'pending';
};
