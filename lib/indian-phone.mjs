export function nationalPhoneNumber(value) {
  return value.replace(/[\s()-]/g, '').replace(/^(?:\+91|0091|91)(?=\d{10}$)/, '');
}
