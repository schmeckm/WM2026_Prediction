function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local : `${local[0]}***${local[local.length - 1]}`;
  return `${visible}@${domain}`;
}

module.exports = { maskEmail };
