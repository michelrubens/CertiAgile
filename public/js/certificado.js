// certificado.js

const NIVEL_LABELS = ['Nível I', 'Nível II', 'Nível III', 'Nível IV', 'Nível V']

async function initCertificado() {
  const urlParams = new URLSearchParams(window.location.search)
  const certificadoHash = urlParams.get('hash')

  mostrarEstado('state-loading')

  try {
    const token = localStorage.getItem('token')
    let certData = null

    // 1. Tenta carregar via Hash (Rota Pública) se presente na URL
    if (certificadoHash) {
      const res = await fetch(`/api/certificados/hash/${certificadoHash}`)
      if (res.ok) {
        certData = await res.json()
      }
    }

    // 2. Se falhou a busca pelo hash ou não tem hash, e o usuário está logado,
    // tentamos carregar os dados através da sessão do próprio usuário (Privado).
    if (!certData && token) {
      const resUser = await apiFetch('/api/usuarios/me')
      if (resUser && resUser.ok) {
        const user = await resUser.json()

        // Só prossegue se: não houver hash na URL OU o hash na URL for o do próprio usuário logado
        if (!certificadoHash || certificadoHash === user.certificado_hash) {
          const resExames = await apiFetch('/api/exames')
          if (resExames && resExames.ok) {
            const exames = await resExames.json()
            const aprovados = exames.filter((e) => e.aprovado).length

            if (aprovados === 5) {
              // Monta a estrutura de dados necessária para o certificado
              certData = {
                aluno: user,
                certificado: {
                  emitidoEm: new Date().toISOString(),
                  certificadoHash: user.certificado_hash
                },
                progresso: {
                  modulosConcluidos: exames.map((e) => ({
                    id_modulo: e.nivel,
                    notasTentativas: [{ concluida: true, nota: e.melhor_nota }]
                  }))
                }
              }
            }
          }
        }
      }
    }

    if (!certData) {
      if (token) {
        // Se está logado mas chegou aqui, é porque não concluiu todos os níveis
        mostrarEstado('state-indisponivel')
        return
      }
      throw new Error('Certificado não encontrado ou inválido.')
    }

    if (certData.indisponivel) {
      mostrarEstado('state-indisponivel')
      return
    }

    const userData = certData.aluno
    const examesData = certData.progresso.modulosConcluidos.map((m) => ({
      nivel: m.id_modulo,
      melhor_nota: m.notasTentativas.find((t) => t.concluida)?.nota || 0,
      aprovado: true
    }))

    document.getElementById('cert-data-emissao').textContent = formatarData(
      certData.certificado.emitidoEm
    )
    // Preenche os detalhes do usuário
    document.getElementById('cert-nome').textContent = userData.nome
    document.getElementById('cert-cpf').textContent = userData.cpf
      ? userData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : '---'
    document.getElementById('cert-email').textContent = userData.email

    // Preenche o hash e gera o QR Code Real apontando para a validação
    const finalHash = certificadoHash || userData.certificado_hash
    document.getElementById('cert-hash').textContent =
      `ID: ${finalHash || '---'}`

    if (finalHash) {
      const verificationUrl = `${window.location.origin}/certificado?hash=${finalHash}`
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`

      const qrImg = document.getElementById('cert-qrcode')
      const qrPlaceholder = document.getElementById('qrcode-placeholder')

      if (qrImg && qrPlaceholder) {
        qrImg.src = qrCodeApiUrl
        qrImg.onload = () => {
          qrImg.classList.remove('hidden')
          qrPlaceholder.classList.add('hidden')
        }
      }
    }

    // Atualiza o link de Certificações na sidebar com o hash do usuário
    const certLinks = Array.from(
      document.querySelectorAll('aside a, nav a, .nav-item')
    ).filter((el) => {
      const text = el.textContent.trim()
      return text.includes('Certificações') || text.includes('Certificados')
    })
    certLinks.forEach((link) => {
      link.href = `/certificado?hash=${certificadoHash || userData.certificado_hash || ''}`
    })

    // Preenche a seção de desempenho por nível
    const levelsContainer = document.getElementById('cert-niveis-container')
    levelsContainer.innerHTML = ''
    let totalNotas = 0
    let countNiveis = 0

    // Garante que os exames sejam exibidos na ordem correta dos níveis
    examesData
      .sort((a, b) => a.nivel - b.nivel)
      .forEach((ex, index) => {
        const nota = (ex.melhor_nota / 10).toFixed(1).replace('.', ',') // Converte de 0-100 para 0-10
        totalNotas += parseFloat(ex.melhor_nota / 10)
        countNiveis++

        levelsContainer.innerHTML += `
                <div class="p-2 rounded-lg bg-surface-container-low border border-surface-container">
                    <p class="text-[10px] text-on-surface-variant font-bold uppercase truncate">${NIVEL_LABELS[index]}</p>
                    <p class="text-base font-bold text-on-surface">${nota}</p>
                </div>
            `
      })

    // Calcula e exibe a média final
    const mediaFinal =
      countNiveis > 0
        ? (totalNotas / countNiveis).toFixed(1).replace('.', ',')
        : '0,0'
    levelsContainer.innerHTML += `
            <div class="p-2 rounded-lg bg-primary-container/10 border border-primary/20">
                <p class="text-[10px] text-primary font-black uppercase truncate">Média Final</p>
                <p id="cert-media-final" class="text-base font-black text-primary">${mediaFinal}</p>
            </div>
        `

    mostrarEstado('state-cert') // Exibe o certificado
  } catch (err) {
    console.error('Erro ao carregar dados do certificado:', err)
    document.getElementById('erro-msg').textContent =
      err.message || 'Ocorreu um erro ao carregar o certificado.'
    mostrarEstado('state-erro')
  }
}

function formatarData(dateString) {
  if (!dateString) return '---'
  const date = new Date(dateString)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('pt-BR', options)
}

function gerarPDF() {
  const element = document.getElementById('cert-document-area')
  const opt = {
    margin: 0,
    filename: 'Certificado-CertiAgile.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'px', format: [1056, 792], orientation: 'landscape' },
    enableLinks: true
  }

  html2pdf().set(opt).from(element).save()
}

function mostrarEstado(id) {
  document
    .querySelectorAll('.state')
    .forEach((el) => el.classList.add('hidden'))
  if (id === 'state-cert') {
    document.getElementById('cert-document-area').classList.remove('hidden')
    document.querySelector('.no-print').classList.remove('hidden')
  } else {
    document.getElementById('cert-document-area').classList.add('hidden')
    document.querySelector('.no-print').classList.add('hidden')
    document.getElementById(id).classList.remove('hidden')
  }
}

// Event Listeners
document.getElementById('btn-download-pdf')?.addEventListener('click', gerarPDF)

// Proteção de rota e inicialização
if (
  !localStorage.getItem('token') &&
  !new URLSearchParams(window.location.search).get('hash')
) {
  // Se não há token e nem hash na URL, redireciona para o login
  window.location.href = '/login'
} else {
  initCertificado()
}
