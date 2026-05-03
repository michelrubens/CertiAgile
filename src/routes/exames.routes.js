const { Router } = require('express')
const {
  findExamesByUsuario
} = require('../respositories/questoes.repositories')
const authMiddleware = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, async function (req, res) {
  try {
    const exames = await findExamesByUsuario(req.usuario.id_usuario)
    return res.status(200).json(exames)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

module.exports = router
