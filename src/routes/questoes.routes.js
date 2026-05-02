const { Router } = require('express')
const {
  findProximaQuestaoByUsuario,
  findQuestaoDoExameByUsuario,
  findRespostaByExameEQuestao,
  inserirRespostaQuestao
} = require('../respositories/questoes.repositories')
const authMiddleware = require('../middlewares/auth.middleware')

const router = Router()

/*
-----------------------------------
  GET /api/questoes/proxima-questao
-----------------------------------
curl -X GET http://localhost:3000/api/questoes/proxima-questao \
-H "Authorization: Bearer SEU_TOKEN"
-----------------------------------
*/
router.get('/proxima-questao', authMiddleware, async function (req, res) {
  try {
    const questao = await findProximaQuestaoByUsuario(req.usuario.id_usuario)

    if (!questao) {
      return res
        .status(404)
        .json({ message: 'Nenhuma questão pendente encontrada.' })
    }
    return res.status(200).json(questao)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

/*
-----------------------------------
  POST /api/questoes/resposta
-----------------------------------
curl -X POST http://localhost:3000/api/questoes/responder \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer SEU_TOKEN" \
 -d '{"id_exame":"11","id_questao":"21","resposta":"c"}'
-----------------------------------
*/
router.post('/responder', authMiddleware, async function (req, res) {
  try {
    const { id_exame, id_questao, resposta } = req.body

    const respostaNormalizada = resposta.trim().toLowerCase()

    const questao = await findQuestaoDoExameByUsuario(
      req.usuario.id_usuario,
      id_exame,
      id_questao
    )

    if (!questao) {
      return res.status(404).json({ message: 'Questão não encontrada.' })
    }

    const respostaExistente = await findRespostaByExameEQuestao(
      id_exame,
      id_questao
    )

    if (respostaExistente) {
      return res.status(409).json({ message: 'Resposta já registrada.' })
    }
    const nota = questao.alternativa_correta === respostaNormalizada ? 1 : 0

    const respostaInserida = await inserirRespostaQuestao(
      id_exame,
      id_questao,
      respostaNormalizada,
      nota
    )

    return res.status(201).json(respostaInserida)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

module.exports = router
