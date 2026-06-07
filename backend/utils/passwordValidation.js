const MIN_PASSWORD_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH || '10', 10);

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, errorKey: 'errors.passwordRequired' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, errorKey: 'errors.passwordMinLength' };
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, errorKey: 'errors.passwordComplexity' };
  }

  return { valid: true };
}

module.exports = { validatePassword, MIN_PASSWORD_LENGTH };
