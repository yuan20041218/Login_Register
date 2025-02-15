import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = 3000

// Database setup

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',     
  password: '123456',     
  database: 'login_register'  
})

// 初始化数据库表
async function initDatabase() {
  const connection = await pool.getConnection()
  try {
    
    
    // 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 检查是否存在管理员用户
    const [rows] = await connection.query("SELECT * FROM users WHERE name = 'admin'")
    if (rows.length === 0) {
      // 创建默认管理员账户，不再加密密码
      await connection.query(
        "INSERT INTO users (name, password, role) VALUES ('admin', 'admin123', 'admin')"
      )
      console.log('Default admin user created')
    }
  } catch (error) {
    console.error('Database initialization error:', error)
  } finally {
    connection.release()
  }
}

initDatabase().catch(console.error)

app.use(cors())
app.use(express.json())

const JWT_SECRET = 'hello-world' // In production, use environment variable

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Login
app.post('/api/auth/login', [
  body('name').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  console.log('twisted xxx')
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, password } = req.body
    const [rows] = await pool.query('SELECT * FROM users WHERE name = ? AND password = ?', [name, password])
    const user = rows[0]
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET)
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// Register
app.post('/api/auth/register', [
  body('name').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log('twisted ==>', req.body)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  try {
    const { name, password } = req.body
    
    // 检查用户名长度
    if (name.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' })
    }
    
    // 检查密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // 直接存储原始密码
    await pool.query(
      'INSERT INTO users (name, password, role) VALUES (?, ?, ?)',
      [name, password, 'user']
    )
    res.status(201).json({ message: 'User created successfully' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' })
    }
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// Get current user
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, role FROM users WHERE id = ?',
      [req.user.id]
    )
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// Get all users (admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, role FROM users')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// Create user (admin only)
app.post('/api/users', authenticateToken, isAdmin, [
  body('name').notEmpty(),
  body('password').notEmpty(),
  body('role').isIn(['user', 'admin'])
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, password, role } = req.body
    const hashedPassword = bcrypt.hashSync(password, 10)

    const [result] = await pool.query(
      'INSERT INTO users (name, password, role) VALUES (?, ?, ?)',
      [name, hashedPassword, role]
    )
    res.status(201).json({ id: result.insertId, name, role })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' })
    }
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, isAdmin, [
  body('name').notEmpty(),
  body('role').isIn(['user', 'admin'])
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, password, role } = req.body
    const userId = req.params.id

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10)
      await pool.query(
        'UPDATE users SET name = ?, password = ?, role = ? WHERE id = ?',
        [name, hashedPassword, role, userId]
      )
    } else {
      await pool.query(
        'UPDATE users SET name = ?, role = ? WHERE id = ?',
        [name, role, userId]
      )
    }
    res.json({ message: 'User updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id
    await pool.query('DELETE FROM users WHERE id = ?', [userId])
    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
