const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role.toLowerCase() === 'candidato' ? 'CANDIDATO' : 
               role.toLowerCase() === 'empresa' ? 'EMPRESA' :
               role.toLowerCase() === 'freelancer' ? 'FREELANCER' :
               role.toLowerCase() === 'emprendedor' ? 'EMPRENDEDOR' :
               role.toLowerCase() === 'estudiante' ? 'ESTUDIANTE' :
               role.toLowerCase() === 'mentor' ? 'MENTOR' : 'CANDIDATO',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        plan: 'FREE',
        profileCompletion: 25,
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: token,
      message: 'Registro exitoso'
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: token,
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// HEALTH
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'joblify-api' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SERVIDOR CORRIENDO en http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /health');
});
