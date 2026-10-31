'use client';
import { useState } from 'react';
import { nationalPhoneNumber } from '../../lib/indian-phone.mjs';

export default function IndianPhoneInput({ name = 'phone', onChange, readOnly = false }) {
  const [number, setNumber] = useState('');
  return <span className="auth-phone-input"><span aria-hidden="true">+91</span><input
    name={name} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="9876543210"
    aria-label={name === 'whatsapp' ? 'WhatsApp number, country code +91' : 'Phone number, country code +91'}
    pattern="[6-9][0-9]{9}" title="Enter your 10-digit Indian mobile number" maxLength={20}
    value={number} readOnly={readOnly} required onChange={event => {
      const next = nationalPhoneNumber(event.target.value);
      setNumber(next);
      onChange?.(`+91${next}`);
    }}
  /></span>;
}
