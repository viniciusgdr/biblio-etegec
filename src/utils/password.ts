import bcryptjs from 'bcryptjs';

export async function saltAndHashPassword(password: string) {
  const salt = await bcryptjs.genSalt(12);
  const hash = await bcryptjs.hash(password, salt);
  return hash;
}

export async function verifyPassword(password: string, hash: string) {
  const isValid = await bcryptjs.compare(password, hash);
  return isValid;
}