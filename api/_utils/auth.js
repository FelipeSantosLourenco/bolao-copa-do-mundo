import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bolao_copa_secret_key_12345';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Não autorizado. Token não fornecido.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // Retorna { id, email }
  } catch (err) {
    throw new Error('Não autorizado. Token inválido ou expirado.');
  }
}
