const { verfifyToken } = require('../utils/jwt')
const { findUsuarioById } = require('../respositories/usuarios.repositories')

async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization

  if (!authorization) {
    return res.status(401).json({ message: 'Não autorizado.' })
  }

  const [type, token] = authorization.split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token inválido.' })
  }

  try {
    const payload = verfifyToken(token)

    const usuario = await findUsuarioById(payload.id_usuario)
    if (!usuario) {
      return res.status(401).json({ message: 'Usuário não encontrado.' })
    }

    req.usuario = usuario

    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

module.exports = authMiddleware
