// painel.js — carrega dados do usuário e renderiza o painel

const NIVEL_LABELS = ['Básico', 'Intermediário', 'Avançado', 'Expert', 'Master']
const NIVEL_DESCS = [
  'Fundamentos das metodologias ágeis',
  'Práticas e frameworks ágeis',
  'Scrum avançado e liderança',
  'Gestão ágil de produtos',
  'Agile Leadership e transformação'
]

async function init() {
  try {
    // Dados do usuário logado
    const resUsuario = await apiFetch('/api/usuarios/me')
    if (!resUsuario) return
    const usuario = await resUsuario.json()

    // Exames do usuário
    const resExames = await apiFetch('/api/exames')
    if (!resExames) return
    const exames = await resExames.json()
    console.log('exames:', exames)

    // Progresso do usuário
    const resProgresso = await apiFetch('/api/questoes/progresso')
    if (!resProgresso) return
    const progresso = await resProgresso.json()

    renderPerfil(usuario, exames)
    renderProgresso(exames, progresso)
    renderNiveis(exames, usuario.nivel_atual ?? 1)
  } catch (err) {
    console.error('Erro ao carregar painel:', err)
  }
}

function renderPerfil(usuario, exames) {
  const cpfFormatado = usuario.cpf
    ? usuario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '—'

  // Cada nível tem 2 tentativas máximas
  // Tentativas restantes = (2 * níveis com exame) - tentativas usadas
  const totalUsadas = exames.reduce(
    (acc, e) => acc + Number(e.tentativas_usadas ?? 0),
    0
  )
  const totalRestantes = exames.reduce(
    (acc, e) => acc + (2 - Number(e.tentativas_usadas ?? 0)),
    0
  )
  const totalConcluidos = exames.filter((e) => e.aprovado).length

  document.getElementById('sidebar-nome').textContent =
    usuario.nome?.split(' ')[0] ?? '—'
  document.getElementById('sidebar-nivel').textContent =
    usuario.nivel_atual ?? '—'
  document.getElementById('profile-nome').textContent = usuario.nome ?? '—'
  document.getElementById('profile-cpf').textContent = `CPF: ${cpfFormatado}`
  document.getElementById('profile-nivel-tag').textContent =
    `Nível ${usuario.nivel_atual ?? '—'}`
  document.getElementById('stat-tentativas').textContent = totalRestantes
  document.getElementById('label-tentativas').textContent =
    totalRestantes === 1 ? 'Tentativa' : 'Tentativas'
  document.getElementById('label-restantes').textContent =
    totalRestantes === 1 ? 'Restante' : 'Restantes'

  // Pinta as bolinhas: verde = usada, cinza = disponível
  const dots = document.querySelectorAll('#tentativas-dots .dot')
  dots.forEach((dot, i) => {
    dot.classList.toggle('usada', i < totalUsadas)
  })

  document.getElementById('stat-aprovacoes').textContent = totalConcluidos
  document.getElementById('label-niveis').textContent =
    totalConcluidos === 1 ? 'Nível' : 'Níveis'
  document.getElementById('label-concluidos').textContent =
    totalConcluidos === 1 ? 'Concluído' : 'Concluídos'
}

function renderProgresso(exames, progresso) {
  const circumference = 2 * Math.PI * 70
  const { respondidas, total } = progresso
  const pct = Math.round((respondidas / total) * 100)

  const offset = circumference - (pct / 100) * circumference
  document.getElementById('ring-fill').style.strokeDashoffset = offset
  document.getElementById('ring-pct').textContent = `${pct}%`

  const aprovados = exames.filter((e) => e.aprovado).length
  document.getElementById('progress-hint').textContent =
    aprovados === 5
      ? 'Parabéns! Você concluiu todos os níveis.'
      : `${respondidas} de ${total} questões respondidas — ${aprovados} de 5 níveis concluídos.`
}

function renderNiveis(exames, nivelAtual) {
  const grid = document.getElementById('levels-grid')
  grid.innerHTML = ''

  for (let i = 1; i <= 5; i++) {
    const exame = exames.find((e) => e.nivel === i)
    const concluido = exame?.aprovado === true
    const temExame = exame != null // já tem exame criado para este nível
    const bloqueado = !concluido && !temExame // bloqueado se não tem exame ainda
    const emProgresso = !concluido && temExame

    let estado = concluido
      ? 'concluido'
      : bloqueado
        ? 'bloqueado'
        : 'em-progresso'
    let badgeLabel = concluido
      ? 'Concluído'
      : bloqueado
        ? 'Bloqueado'
        : 'Em progresso'
    let icon = concluido ? 'verified' : bloqueado ? 'lock' : 'pending'
    let iconFill = concluido ? `style="font-variation-settings:'FILL' 1"` : ''

    const melhorNota =
      exame?.melhor_nota != null ? `${exame.melhor_nota}%` : '—'

    const tentativasUsadas = Number(exame?.tentativas_usadas ?? 0)
    const tentativasIniciadas = Number(exame?.tentativas_iniciadas ?? 0)
    const tentativasMax = 2
    const temAndamento = tentativasIniciadas > tentativasUsadas

    let footerHTML = ''
    if (concluido) {
      const temTentativaDisponivel = tentativasUsadas < tentativasMax
      footerHTML = `
        <span class="nivel-concluido-label">
          <span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">check_circle</span>
          Nível concluído
        </span>
        ${
          temTentativaDisponivel
            ? `
          <button class="btn-level outline-green" onclick="window.location.href='/avaliacao'">
            ${temAndamento ? 'Continuar tentativa' : 'Fazer nova tentativa'}
          </button>`
            : ''
        }
      `
    } else if (emProgresso) {
      footerHTML = `
        <button class="btn-level primary" onclick="window.location.href='/avaliacao'">
          ${temAndamento ? 'Continuar Avaliação' : 'Iniciar Avaliação'}
        </button>
      `
    }

    let statsHTML = ''
    if (!bloqueado) {
      statsHTML = `
        <div class="level-stats">
          <div class="level-stat-row">
            <span>Melhor Nota</span>
            <span class="${concluido ? 'val-green' : ''}">${melhorNota}</span>
          </div>
          <div class="level-stat-row">
            <span>${concluido ? 'Tentativas' : 'Tentativas Restantes'}</span>
            <span class="${emProgresso && tentativasUsadas >= 1 ? 'val-yellow' : ''}">
              ${concluido ? `${tentativasUsadas} / ${tentativasMax}` : tentativasMax - tentativasUsadas}
            </span>
          </div>
        </div>`
    } else {
      const pctReq = Math.round(((i - nivelAtual) / 1) * 33)
      statsHTML = `
        <p style="font-size:.75rem;color:var(--color-secondary);line-height:1.5">
          Conclua o nível anterior para desbloquear este.
        </p>
        <div class="level-progress-bar">
          <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
          <span style="font-size:.6rem;font-weight:700;color:var(--color-secondary);text-transform:uppercase;letter-spacing:.05em;margin-top:4px;display:block">
            BLOQUEADO
          </span>
        </div>`
    }

    grid.innerHTML += `
      <div class="level-card ${estado}">
        <div class="level-card-header">
          <div class="level-icon ${estado}">
            <span class="material-symbols-outlined" ${iconFill}>${icon}</span>
          </div>
          <span class="level-badge ${estado}">${badgeLabel}</span>
        </div>
        <p class="level-name">Nível ${i} — ${NIVEL_LABELS[i - 1]}</p>
        <p class="level-desc">${NIVEL_DESCS[i - 1]}</p>
        ${statsHTML}
        ${footerHTML}
      </div>`
  }
}

// Logout
document.getElementById('btn-logout').addEventListener('click', function () {
  localStorage.removeItem('token')
  window.location.href = '/login'
})

init()
