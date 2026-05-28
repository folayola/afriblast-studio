'use client';

import { useState } from 'react';

interface PaystackMetadata {
  material_id?: string;
  broadcaster_id: string;
  purchase_type: 'material' | 'subscription';
}

interface PaystackPaymentProps {
  email: string;
  amount: number; // Input value in Naira (e.g., 3500)
  metadata: PaystackMetadata;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function usePaystackCheckout() {
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePayment = ({ email, amount, metadata, onSuccess, onClose }: PaystackPaymentProps) => {
    if (isInitializing) return;
    setIsInitializing(true);

    // Paystack Pop core engine expects values strictly in Kobo (Naira * 100)
    const koboAmount = Math.round(amount * 100);

    // Verify that the global inline.js script has successfully mounted to the client window
    const PaystackPop = (window as any).PaystackPop;

    if (!PaystackPop) {
      console.error("Paystack SDK script not loaded yet. Verify inline.js is present in your root layout.");
      alert("Payment gateway is initializing. Please try again in a brief moment.");
      setIsInitializing(false);
      return;
    }

    try {
      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: koboAmount,
        currency: 'NGN',
        metadata: metadata,
        callback: function (response: { reference: string }) {
          setIsInitializing(false);
          // Pass the secure transaction reference token up to your verification handler
          onSuccess(response.reference);
        },
        onClose: function () {
          setIsInitializing(false);
          onClose();
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Failed to initialize Paystack transactional iframe gateway:", error);
      setIsInitializing(false);
    }
  };

  return { 
    initializePayment,
    isInitializing 
  };
}