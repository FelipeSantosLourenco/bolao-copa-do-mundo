import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../_utils/auth.js';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos (nome, email e senha) são obrigatórios.' });
  }

  try {
    // Verifica se o email já está cadastrado
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insere o usuário no banco de dados
    const insertQuery = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `;
    const result = await pool.query(insertQuery, [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash
    ]);

    const newUser = result.rows[0];

    // Gera o token JWT
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Erro no registro de usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
  }
}
