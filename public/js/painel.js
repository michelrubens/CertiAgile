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

    renderPerfil(usuario)
    renderProgresso(exames)
    renderNiveis(exames, usuario.nivel_atual ?? 1)
  } catch (err) {
    console.error('Erro ao carregar painel:', err)
  }
}

function renderPerfil(usuario) {
  const cpfFormatado = usuario.cpf
    ? usuario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '—'

  document.getElementById('sidebar-nome').textContent =
    usuario.nome?.split(' ')[0] ?? '—'
  document.getElementById('sidebar-nivel').textContent =
    usuario.nivel_atual ?? '—'
  document.getElementById('profile-nome').textContent = usuario.nome ?? '—'
  document.getElementById('profile-cpf').textContent = `CPF: ${cpfFormatado}`
  document.getElementById('profile-nivel-tag').textContent =
    `Nível ${usuario.nivel_atual ?? '—'}`
  document.getElementById('stat-tentativas').textContent =
    usuario.total_tentativas ?? '—'
  document.getElementById('stat-aprovacoes').textContent =
    usuario.total_aprovacoes ?? '—'
}

function renderProgresso(exames) {
  const total = 5
  const concluidos = exames.filter((e) => e.aprovado).length
  const pct = Math.round((concluidos / total) * 100)
  const restantes = total - concluidos

  // Anel
  const circumference = 2 * Math.PI * 70 // 439.8
  const offset = circumference - (pct / 100) * circumference
  document.getElementById('ring-fill').style.strokeDashoffset = offset
  document.getElementById('ring-pct').textContent = `${pct}%`

  // Hint
  const hint =
    restantes > 0
      ? `Você está a ${restantes} nível${restantes > 1 ? 's' : ''} da certificação final.`
      : 'Parabéns! Você concluiu todos os níveis.'
  document.getElementById('progress-hint').textContent = hint
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
    const tentativasUsadas = exame?.tentativas_usadas ?? 0
    const tentativasMax = 2

    let footerHTML = ''
    if (concluido) {
      footerHTML = `<a href="/certificado" class="btn-level primary">Download Certificado</a>`
    } else if (emProgresso) {
      footerHTML = `<button class="btn-level primary" onclick="window.location.href='/avaliacao'">
        ${tentativasUsadas === 0 ? 'Iniciar Avaliação' : 'Retomar Avaliação'}
      </button>`
    } else {
      footerHTML = `<button class="btn-level outline" disabled>Bloqueado</button>`
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
