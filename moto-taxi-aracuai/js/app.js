// ===== CONFIGURAÇÃO =====
const API_URL = 'http://localhost:8080/api';
const CENTRO_ARACUAI = [-16.85, -42.06];
const PRECO_POR_KM = 4.00;
const ZOOM_INICIAL = 14;

// Pontos de referência em Araçuaí
const PONTOS = {
  "Praça da Matriz, Araçuaí": [-16.8495, -42.0650],
  "Hospital São José": [-16.8520, -42.0580],
  "Rodoviária": [-16.8555, -42.0700],
  "Centro Comercial": [-16.8480, -42.0620],
  "Terminal Rodoviário": [-16.8555, -42.0700],
  "Prefeitura": [-16.8505, -42.0640],
  "Mercado Municipal": [-16.8475, -42.0610]
};

// Estado global
let mapa = null;
let marcadorOrigem = null;
let marcadorDestino = null;
let marcadorMoto = null;
let rotaLayer = null;
let usuarioLogado = null;      // { id, nome, tipo }
let corridaAtual = null;       // objeto da corrida retornado pela API
let motoristaAtual = null;
let distanciaKm = 0;
let valorEstimado = 0;
let favorito = false;
let intervaloAnimacao = null;
let intervaloPolling = null;
let modoOffline = false;       // true se o backend não estiver rodando

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se o backend está online
  fetch(`${API_URL}/motoristas/livres`)
    .then(r => {
      if (r.ok) {
        modoOffline = false;
        console.log('✅ Backend conectado em', API_URL);
      } else {
        modoOffline = true;
      }
    })
    .catch(() => {
      modoOffline = true;
      console.warn('⚠️ Backend offline – usando modo demonstração');
    });
});

// ===== LOGIN (API real) =====
async function fazerLogin(e) {
  e.preventDefault();
  const login = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;

  if (!login || !senha) {
    mostrarToast('Preencha usuário e senha');
    return;
  }

  // Tenta API real
  if (!modoOffline) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha })
      });

      const data = await res.json();

      if (data.sucesso) {
        usuarioLogado = { id: data.id, nome: data.nome, tipo: data.tipo };
        entrarNoApp(data.nome);
        return;
      } else {
        mostrarToast(data.mensagem || 'Usuário ou senha inválidos');
        return;
      }
    } catch (err) {
      console.warn('Backend indisponível, entrando em modo demo');
      modoOffline = true;
    }
  }

  // Fallback demo (quando backend não está rodando)
  usuarioLogado = { id: 1, nome: login, tipo: 'CLIENTE' };
  entrarNoApp(login);
}

function entrarNoApp(nome) {
  document.getElementById('tela-login').classList.remove('ativa');
  document.getElementById('tela-app').classList.add('ativa');
  document.getElementById('nome-usuario').textContent = `Olá, ${nome}`;
  setTimeout(iniciarMapa, 100);
  mostrarToast(modoOffline
    ? 'Modo demonstração (backend offline)'
    : 'Conectado ao servidor!');
}

function logout() {
  pararTudo();
  usuarioLogado = null;
  corridaAtual = null;
  document.getElementById('tela-app').classList.remove('ativa');
  document.getElementById('tela-login').classList.add('ativa');
  resetarApp();
}

// ===== MAPA =====
function iniciarMapa() {
  if (mapa) mapa.remove();

  mapa = L.map('mapa', { zoomControl: false }).setView(CENTRO_ARACUAI, ZOOM_INICIAL);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(mapa);

  L.control.zoom({ position: 'bottomright' }).addTo(mapa);

  Object.entries(PONTOS).forEach(([nome, coords]) => {
    L.circleMarker(coords, {
      radius: 4,
      color: '#1565c0',
      fillColor: '#42a5f5',
      fillOpacity: 0.7
    }).addTo(mapa).bindPopup(nome);
  });
}

// ===== FAVORITOS =====
function usarFavorito(nome) {
  document.getElementById('destino').value = nome;
  mostrarToast(`Destino: ${nome}`);
}

// ===== CALCULAR ROTA (local – só visual) =====
function calcularRota() {
  const origemTxt = document.getElementById('origem').value.trim();
  const destinoTxt = document.getElementById('destino').value.trim();

  if (!destinoTxt) {
    mostrarToast('Informe o destino');
    return;
  }

  const origem = PONTOS[origemTxt] || CENTRO_ARACUAI;
  const destino = PONTOS[destinoTxt] || gerarPontoAleatorio();

  limparMarcadores();

  const iconOrigem = L.divIcon({
    className: 'marcador-origem',
    html: '<div class="marcador-ponto origem"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
  marcadorOrigem = L.marker(origem, { icon: iconOrigem }).addTo(mapa);

  const iconDestino = L.divIcon({
    className: 'marcador-destino',
    html: '<div class="marcador-ponto destino"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
  marcadorDestino = L.marker(destino, { icon: iconDestino }).addTo(mapa);

  distanciaKm = calcularDistancia(origem, destino);
  valorEstimado = distanciaKm * PRECO_POR_KM;

  if (rotaLayer) mapa.removeLayer(rotaLayer);
  rotaLayer = L.polyline([origem, destino], {
    color: '#00c853',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(mapa);

  mapa.fitBounds([origem, destino], { padding: [60, 60] });

  document.getElementById('distancia-km').textContent = distanciaKm.toFixed(1) + ' km';
  document.getElementById('valor-estimado').textContent = formatarMoeda(valorEstimado);

  mudarEtapa('confirmar');
}

// ===== SOLICITAR CORRIDA (API real) =====
async function solicitarCorrida() {
  const pagamento = document.querySelector('input[name="pagamento"]:checked').value;
  const origemTxt = document.getElementById('origem').value.trim();
  const destinoTxt = document.getElementById('destino').value.trim();
  const origem = PONTOS[origemTxt] || CENTRO_ARACUAI;
  const destino = PONTOS[destinoTxt] || (marcadorDestino ? [marcadorDestino.getLatLng().lat, marcadorDestino.getLatLng().lng] : gerarPontoAleatorio());

  mudarEtapa('procurando');
  document.getElementById('status-busca').textContent = 'Enviando solicitação...';

  if (!modoOffline && usuarioLogado) {
    try {
      const body = {
        clienteId: usuarioLogado.id,
        origemEndereco: origemTxt || 'Origem',
        origemLat: origem[0],
        origemLng: origem[1],
        destinoEndereco: destinoTxt || 'Destino',
        destinoLat: destino[0],
        destinoLng: destino[1],
        formaPagamento: pagamento.toUpperCase()
      };

      const res = await fetch(`${API_URL}/corridas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Erro ao solicitar');

      corridaAtual = await res.json();
      document.getElementById('status-busca').textContent = 'Corrida criada! Procurando mototaxista...';

      // Atualiza valor com o calculado pelo backend
      if (corridaAtual.valorEstimado) {
        valorEstimado = corridaAtual.valorEstimado;
        distanciaKm = corridaAtual.distanciaKm || distanciaKm;
      }

      // Inicia polling de status + simula aceitação (já que não temos app do motorista ainda)
      iniciarPollingStatus();
      simularAceitacaoMotorista();
      return;
    } catch (err) {
      console.warn('Falha na API, usando modo demo', err);
      modoOffline = true;
    }
  }

  // Fallback demo
  simularBuscaDemo(pagamento);
}

// Polling do status da corrida
function iniciarPollingStatus() {
  if (intervaloPolling) clearInterval(intervaloPolling);

  intervaloPolling = setInterval(async () => {
    if (!corridaAtual || !corridaAtual.id) return;

    try {
      const res = await fetch(`${API_URL}/corridas/${corridaAtual.id}`);
      if (res.ok) {
        corridaAtual = await res.json();
        atualizarUIPeloStatus(corridaAtual.status);
      }
    } catch (e) {
      // ignora erros de rede temporários
    }
  }, 2500);
}

function atualizarUIPeloStatus(status) {
  switch (status) {
    case 'ACEITA':
    case 'A_CAMINHO':
      if (document.getElementById('etapa-caminho').classList.contains('ativa') === false) {
        // já tratado na simulação
      }
      break;
    case 'CANCELADA':
      pararTudo();
      mudarEtapa('solicitar');
      mostrarToast('Corrida cancelada');
  if (typeof Sons !== "undefined") Sons.aviso();
      break;
    case 'FINALIZADA':
      pararTudo();
      break;
  }
}

// Como ainda não temos o app do motorista, simulamos a aceitação
// mas a corrida já existe no banco
async function simularAceitacaoMotorista() {
  const statusEl = document.getElementById('status-busca');
  const msgs = [
    'Buscando disponíveis...',
    '3 mototaxistas online próximos...',
    'Verificando disponibilidade...',
    'Mototaxista encontrado!'
  ];

  for (let i = 0; i < msgs.length; i++) {
    statusEl.textContent = msgs[i];
    await esperar(900);
  }

  // Tenta aceitar com o motorista 1 (João) se backend estiver online
  if (!modoOffline && corridaAtual) {
    try {
      // Busca motoristas livres
      const resLivres = await fetch(`${API_URL}/motoristas/livres`);
      let motoristaId = 1;
      if (resLivres.ok) {
        const livres = await resLivres.json();
        if (livres.length > 0) motoristaId = livres[0].id;
      }

      const res = await fetch(`${API_URL}/corridas/${corridaAtual.id}/aceitar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoristaId })
      });

      if (res.ok) {
        corridaAtual = await res.json();
        motoristaAtual = {
          nome: corridaAtual.motorista?.usuario?.nome || 'João Silva',
          placa: corridaAtual.motorista?.placa || 'ABC-1D23',
          moto: corridaAtual.motorista?.modeloMoto || 'Honda CG 160',
          nota: corridaAtual.motorista?.nota || 4.8
        };
      }
    } catch (e) {
      console.warn('Não foi possível aceitar via API', e);
    }
  }

  // Se não conseguiu dados da API, usa padrão
  if (!motoristaAtual) {
    motoristaAtual = {
      nome: 'João Silva',
      placa: 'ABC-1D23',
      moto: 'Honda CG 160',
      nota: 4.8
    };
  }

  mostrarMotoristaACaminho();
}

function simularBuscaDemo(pagamento) {
  const statusEl = document.getElementById('status-busca');
  const msgs = [
    'Buscando disponíveis...',
    '3 mototaxistas online próximos...',
    'Verificando disponibilidade...',
    'Mototaxista encontrado!'
  ];

  let i = 0;
  const interval = setInterval(() => {
    statusEl.textContent = msgs[i];
    i++;
    if (i >= msgs.length) {
      clearInterval(interval);
      motoristaAtual = {
        nome: 'João Silva',
        placa: 'ABC-1D23',
        moto: 'Honda CG 160',
        nota: 4.8
      };
      setTimeout(mostrarMotoristaACaminho, 500);
    }
  }, 900);
}

function mostrarMotoristaACaminho() {
  document.getElementById('nome-motorista').textContent = motoristaAtual.nome;
  document.querySelector('.dados-motorista p').textContent =
    `${motoristaAtual.moto} • Placa ${motoristaAtual.placa}`;
  document.querySelector('.estrelas').innerHTML =
    '★'.repeat(Math.floor(motoristaAtual.nota)) +
    (motoristaAtual.nota % 1 >= 0.5 ? '☆' : '') +
    ` <small>${motoristaAtual.nota}</small>`;

  const origem = marcadorOrigem.getLatLng();
  const posInicial = [
    origem.lat + (Math.random() - 0.5) * 0.008,
    origem.lng + (Math.random() - 0.5) * 0.008
  ];

  const iconMoto = L.divIcon({
    className: 'marcador-moto',
    html: '<div class="marcador-moto-inner">🛵</div>',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });

  if (marcadorMoto) mapa.removeLayer(marcadorMoto);
  marcadorMoto = L.marker(posInicial, { icon: iconMoto }).addTo(mapa)
    .bindPopup(`<b>${motoristaAtual.nome}</b><br>A caminho!`);

  mapa.setView(posInicial, 15);

  document.getElementById('valor-ao-vivo').textContent = formatarMoeda(valorEstimado);
  document.getElementById('barra-progresso').style.width = '0%';

  mudarEtapa('caminho');
  mostrarToast(`${motoristaAtual.nome} aceitou sua corrida!`);
  if (typeof Sons !== "undefined") Sons.corridaAceita();

  // Atualiza status no backend para A_CAMINHO
  if (!modoOffline && corridaAtual) {
    fetch(`${API_URL}/corridas/${corridaAtual.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'A_CAMINHO' })
    }).catch(() => {});
  }

  animarAproximacao(posInicial, [origem.lat, origem.lng]);
}

// ===== ANIMAÇÃO DO MOTO =====
function animarAproximacao(inicio, fim) {
  const duracao = 12000;
  const passos = 60;
  const intervalo = duracao / passos;
  let passo = 0;

  if (intervaloAnimacao) clearInterval(intervaloAnimacao);

  intervaloAnimacao = setInterval(() => {
    passo++;
    const t = passo / passos;

    const lat = inicio[0] + (fim[0] - inicio[0]) * t;
    const lng = inicio[1] + (fim[1] - inicio[1]) * t;

    if (marcadorMoto) marcadorMoto.setLatLng([lat, lng]);

    document.getElementById('barra-progresso').style.width = Math.min(100, t * 100) + '%';

    const segundosRestantes = Math.ceil((1 - t) * (duracao / 1000));
    const min = Math.floor(segundosRestantes / 60);
    const seg = segundosRestantes % 60;
    document.getElementById('tempo-eta').textContent =
      min > 0 ? `${min} min ${seg}s` : `${seg}s`;

    const valorAtual = valorEstimado * (0.95 + Math.random() * 0.1);
    document.getElementById('valor-ao-vivo').textContent = formatarMoeda(valorAtual);

    if (passo >= passos) {
      clearInterval(intervaloAnimacao);
      intervaloAnimacao = null;
      chegouMotorista();
    }
  }, intervalo);
}

function chegouMotorista() {
  document.getElementById('msg-chegada').textContent =
    `${motoristaAtual.nome} está te esperando no local de origem.`;
  document.getElementById('valor-final').textContent =
    document.getElementById('valor-ao-vivo').textContent;

  mudarEtapa('chegou');
  mostrarToast('🛵 Mototaxista chegou!');
  if (typeof Sons !== "undefined") Sons.motoChegou();

  if (marcadorMoto) marcadorMoto.openPopup();
}

// ===== AÇÕES =====
async function cancelarCorrida() {
  pararTudo();

  if (!modoOffline && corridaAtual && corridaAtual.id) {
    try {
      await fetch(`${API_URL}/corridas/${corridaAtual.id}/cancelar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Cancelado pelo cliente' })
      });
    } catch (e) {
      console.warn('Erro ao cancelar na API', e);
    }
  }

  corridaAtual = null;
  limparMarcadores();
  mudarEtapa('solicitar');
  mostrarToast('Corrida cancelada');
  if (typeof Sons !== "undefined") Sons.aviso();
}

async function finalizarCorrida() {
  if (!modoOffline && corridaAtual && corridaAtual.id) {
    try {
      await fetch(`${API_URL}/corridas/${corridaAtual.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EM_VIAGEM' })
      });
    } catch (e) {}
  }

  mostrarToast('Viagem iniciada! Boa viagem 🛵');
  if (typeof Sons !== "undefined") Sons.corridaFinalizada();
  setTimeout(() => {
    pararTudo();
    limparMarcadores();
    mudarEtapa('solicitar');
    document.getElementById('destino').value = '';
    corridaAtual = null;
  }, 1500);
}

function toggleFavorito() {
  favorito = !favorito;
  const btn = document.getElementById('btn-favorito');
  if (favorito) {
    btn.classList.add('ativo');
    btn.innerHTML = '<i class="fas fa-heart"></i>';
    mostrarToast(`${motoristaAtual.nome} adicionado aos favoritos`);
  } else {
    btn.classList.remove('ativo');
    btn.innerHTML = '<i class="far fa-heart"></i>';
    mostrarToast('Removido dos favoritos');
  }
}

function ligarMotorista() {
  mostrarToast(`Ligando para ${motoristaAtual.nome}...`);
}

function abrirMenu() {
  const modo = modoOffline ? 'Demonstração' : 'Conectado ao servidor';
  mostrarToast(`Menu • ${modo}`);
}

// ===== UTILITÁRIOS =====
function pararTudo() {
  if (intervaloAnimacao) { clearInterval(intervaloAnimacao); intervaloAnimacao = null; }
  if (intervaloPolling) { clearInterval(intervaloPolling); intervaloPolling = null; }
}

function mudarEtapa(nome) {
  document.querySelectorAll('.etapa').forEach(e => e.classList.remove('ativa'));
  document.getElementById('etapa-' + nome).classList.add('ativa');
}

function limparMarcadores() {
  if (marcadorOrigem) { mapa.removeLayer(marcadorOrigem); marcadorOrigem = null; }
  if (marcadorDestino) { mapa.removeLayer(marcadorDestino); marcadorDestino = null; }
  if (marcadorMoto) { mapa.removeLayer(marcadorMoto); marcadorMoto = null; }
  if (rotaLayer) { mapa.removeLayer(rotaLayer); rotaLayer = null; }
}

function resetarApp() {
  limparMarcadores();
  if (mapa) { mapa.remove(); mapa = null; }
  mudarEtapa('solicitar');
  document.getElementById('destino').value = '';
  favorito = false;
  corridaAtual = null;
}

function gerarPontoAleatorio() {
  const lat = CENTRO_ARACUAI[0] + (Math.random() - 0.5) * 0.03;
  const lng = CENTRO_ARACUAI[1] + (Math.random() - 0.5) * 0.03;
  return [lat, lng];
}

function calcularDistancia(p1, p2) {
  const R = 6371;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1.15;
}

function formatarMoeda(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

function mostrarToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('mostrar');
  setTimeout(() => toast.classList.remove('mostrar'), 2800);
}

function voltarEtapa(nome) {
  mudarEtapa(nome);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
