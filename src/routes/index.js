const { Router } = require('express')
const usuariosRoutes = require('./usuarios.routes')
const authRoutes = require('./auth.routes')
const questoesRoutes = require('./questoes.routes')
const examesRoutes = require('./exames.routes')
const certificados = require('./certificados.routes')

const router = Router()

// http://localhost:3000/api/usuarios
router.use('/usuarios', usuariosRoutes)

// http://localhost:3000/api/auth
router.use('/auth', authRoutes)

// http://localhost:3000/api/questoes
router.use('/questoes', questoesRoutes)

// http://localhost:3000/api/certificados
router.use('/certificados', certificados)

// http://localhost:3000/api/exames
router.use('/exames', examesRoutes)

router.use(function (_req, res) {
  res.status(404).json({ message: 'Rota não encontrada.' })
})

module.exports = router
