"use client";

import React, { useState } from 'react';
import { createDonationPayment } from '@/app/lib/pi-network';

interface DonateButtonProps {
  amount: number;
  buttonText: string;
}

const DonateButton: React.FC<DonateButtonProps> = ({ amount, buttonText }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await createDonationPayment(amount);
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al procesar el pago';
      setError(errorMessage);
      console.error('Error en DonateButton:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#A68F5E' : 'black',
          border: '1px solid #E5C158',
          color: '#E5C158',
          textTransform: 'uppercase',
          fontFamily: 'serif',
          padding: '5px 20px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          borderRadius: '5px',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {isLoading ? 'Procesando...' : buttonText}
      </button>
      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default DonateButton;
