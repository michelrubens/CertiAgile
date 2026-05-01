const { Router } = require('express')
const { createUsuario } = require('../respositories/usuarios.repositories')

const router = Router()

// POST /api
router.post('/', async function (req, res) {
  const { nome, cpf, email, senha } = req.body

  if (!nome || !cpf || !email || !senha) {
    return res
      .status(400)
      .json({ message: 'Nome, CPF, e-mail e senha são obrigatórios' })
  }

  const result = await createUsuario(nome, cpf, email, senha)

  res.send(result)
})

// PUT /api

// DELETE /api

// GET /api

module.exports = router

/*
------------------------------
POST /api/usuarios 
------------------------------
curl -X POST http://localhost:3000/api \
-H "Content-Type: application/json" \
-d '{"nome":"Pedro","cpf":"11122233300","email":"pedro@teste.com","senha":"123456"}' 
------------------------------

*/
