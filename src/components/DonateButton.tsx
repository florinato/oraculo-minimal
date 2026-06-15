import React from 'react';
import { createDonationPayment } from '../app/lib/pi-network';

interface DonateButtonProps {
  amount: number;
  buttonText: string;
}

const DonateButton: React.FC<DonateButtonProps> = ({ amount, buttonText }) => {
  const handleClick = () => {
    createDonationPayment(amount);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: 'black',
        border: '1px solid #E5C158',
        color: '#E5C158',
        textTransform: 'uppercase',
        fontFamily: 'serif',
        padding: '5px 20px',
        cursor: 'pointer',
        borderRadius: '5px',
      }}
    >
      {buttonText}
    </button>
  );
};

export default DonateButton;
