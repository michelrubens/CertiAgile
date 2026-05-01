const pool = require('../database/db')
const { randomBytes } = require('crypto')

async function insertUsuario(nome, cpf, email, senha) {
  const certificadoHash = randomBytes(24).toString('hex')

  const result = await pool.query(
    `INSERT INTO usuarios (nome, cpf, email, senha, certificado_hash) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id_usuario, nome, cpf, email, certificado_hash`,
    [nome, cpf, email, senha, certificadoHash]
  )
  if (result && result.rowCount == 1) {
    return result.rows[0]
  }
  return null
}

async function createUsuario(nome, cpf, email, senha) {
  const usuario = await insertUsuario(nome, cpf, email, senha)
  if (!usuario) {
    return { message: 'Erro ao criar usuário' }
  }

  return usuario
}

module.exports = {
  createUsuario
}
