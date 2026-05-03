const { Router } = require('express')
const {
  findProximaQuestaoByUsuario,
  findQuestaoDoExameByUsuario,
  findRespostaByExameEQuestao,
  inserirRespostaQuestao,
  usuarioConcluiuModuloAtual,
  findModuloAtualByUsuario,
  findOutroGrupoAleatorio,
  updateProximaTentativa,
  findProximoModuloByUsuario,
  updateProximoModulo,
  countQuestoesRespondidasByUsuario
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

/* 
-----------------------------------
  PATCH /api/questoes/proxima-tentativa
-----------------------------------
curl -X PATCH http://localhost:3000/api/questoes/proxima-tentativa \ 
  -H "Authorization: Bearer SEU_TOKEN" 
-----------------------------------
*/
router.patch('/proxima-tentativa', authMiddleware, async function (req, res) {
  try {
    const concluido = await usuarioConcluiuModuloAtual(req.usuario.id_usuario)
    if (!concluido) {
      return res.status(409).json({
        message: 'Você ainda não concluiu todas as questões do módulo atual.'
      })
    }

    const modulo = await findModuloAtualByUsuario(req.usuario.id_usuario)

    if (!modulo) {
      return res.status(404).json({
        message: 'Módulo atual não encontrado.'
      })
    }

    if (modulo.tentativa >= 2) {
      return res.status(409).json({
        message: 'Limite de 2 tentativas atingido.'
      })
    }

    const grupo = await findOutroGrupoAleatorio(
      req.usuario.id_usuario,
      modulo.id_modulo
    )

    if (!grupo) {
      return res.status(404).json({
        message: 'Nenhum grupo alternativo disponível para este módulo.'
      })
    }

    const exame = await updateProximaTentativa(
      modulo.id_exame,
      grupo,
      modulo.tentativa + 1
    )

    if (!exame) {
      return res.status(404).json({
        message: 'Exame não encontrado para atualização.'
      })
    }

    return res.status(200).json(exame)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

/* 
-----------------------------------
  PATCH /api/questoes/proximo-modulo
-----------------------------------
curl -X PATCH http://localhost:3000/api/questoes/proximo-modulo \ 
  -H "Authorization: Bearer SEU_TOKEN" 
-----------------------------------
*/
router.patch('/proximo-modulo', authMiddleware, async function (req, res) {
  try {
    const concluido = await usuarioConcluiuModuloAtual(req.usuario.id_usuario)
    if (!concluido) {
      return res.status(409).json({
        message: 'Você ainda não concluiu todas as questões do módulo atual.'
      })
    }

    const moduloAtual = await findModuloAtualByUsuario(req.usuario.id_usuario)

    if (!moduloAtual) {
      return res.status(404).json({
        message: 'Módulo atual não encontrado.'
      })
    }

    const modulo = await findProximoModuloByUsuario(req.usuario.id_usuario)

    if (!modulo) {
      return res.status(404).json({
        message: 'Você concluiu todos os módulos.'
      })
    }

    const grupo = await findOutroGrupoAleatorio(req.usuario.id_usuario, modulo)

    if (!grupo) {
      return res.status(404).json({
        message: 'Nenhum grupo alternativo disponível para este módulo.'
      })
    }

    const exame = await updateProximoModulo(
      moduloAtual.id_exame,
      modulo,
      grupo,
      1
    )

    if (!exame) {
      return res.status(404).json({
        message: 'Exame não encontrado para atualização.'
      })
    }

    return res.status(200).json(exame)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

/*
------------------------------------------
  GET /api/questoes/progresso
------------------------------------------
curl -X GET http://localhost:3000/api/questoes/progresso \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
------------------------------------------
*/

router.get('/progresso', authMiddleware, async function (req, res) {
  const total = await countQuestoesRespondidasByUsuario(req.usuario.id_usuario)
  return res.status(200).json({ respondidas: total, total: 50 })
})

module.exports = router
