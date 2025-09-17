
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_padrao_para_desenvolvimento';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initializeDatabase = async () => {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  const createUserDataTableQuery = `
    CREATE TABLE IF NOT EXISTS user_data (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      geom GEOMETRY(Geometry, 4326) NOT NULL,
      properties JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pool.query(createUsersTableQuery);
    await pool.query(createUserDataTableQuery);
    console.log('Database initialized, tables are ready.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, password_hash]
    );
    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: newUser.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Este email já está em uso.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({
      message: 'Login bem-sucedido!',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT id, user_id, properties, ST_AsGeoJSON(geom) as geometry FROM user_data WHERE user_id = $1`,
      [userId]
    );
    const features = result.rows.map(row => ({
      type: 'Feature',
      id: row.id, // Importante: o ID da feature vem do banco de dados
      geometry: JSON.parse(row.geometry),
      properties: row.properties || {},
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Erro ao buscar dados.' });
  }
});

app.post('/data', authenticateToken, async (req, res) => {
  const { geometry, properties } = req.body;
  const userId = req.user.userId;

  if (!geometry) {
    return res.status(400).json({ message: 'Geometria é obrigatória.' });
  }

  try {
    const geoJsonString = JSON.stringify(geometry);
    const insertQuery = `
      INSERT INTO user_data (user_id, geom, properties)
      VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3)
      RETURNING id;
    `;
    const result = await pool.query(insertQuery, [userId, geoJsonString, properties || {}]);
    res.status(201).json({ message: 'Dado salvo com sucesso!', id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving user data to database:', error);
    res.status(500).json({ message: 'Erro ao salvar dado.' });
  }
});

app.put('/data/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { properties } = req.body;
  const userId = req.user.userId;

  if (!properties) {
    return res.status(400).json({ message: 'Propriedades são obrigatórias para atualização.' });
  }

  try {
    const updateQuery = `
      UPDATE user_data 
      SET properties = $1 
      WHERE id = $2 AND user_id = $3
      RETURNING id;
    `;
    const result = await pool.query(updateQuery, [properties, id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Desenho não encontrado ou não pertence a este usuário.' });
    }

    res.status(200).json({ message: 'Propriedades atualizadas com sucesso!', id: result.rows[0].id });
  } catch (error) {
    console.error('Error updating feature properties:', error);
    res.status(500).json({ message: 'Erro ao atualizar propriedades.' });
  }
});

// NOVO ENDPOINT PARA EXCLUIR DESENHOS
app.delete('/data/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const deleteQuery = `
      DELETE FROM user_data 
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await pool.query(deleteQuery, [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Desenho não encontrado ou não pertence a este usuário.' });
    }

    res.status(204).send(); // 204 No Content: sucesso, sem corpo de resposta

  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({ message: 'Erro ao excluir desenho.' });
  }
});

app.get('/', (req, res) => res.send('API do Projeto Carcará está no ar!'));

const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor API rodando na porta ${PORT}`);
  });
};

startServer();
