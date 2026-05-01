const { Router } = require('express')
const usuariosRoutes = require('./usuarios.routes')

const router = Router()

// http://localhost:3000/api/usuarios
router.use('/usuarios', usuariosRoutes)

router.use(function (_req, res) {
  res.status(404).json({ message: 'Rota não encontrada.' })
})

module.exports = router
