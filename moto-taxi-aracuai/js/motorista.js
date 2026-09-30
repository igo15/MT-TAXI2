// ===== CONFIG =====
const API_URL = 'http://localhost:8080/api';
const CENTRO = [-16.85, -42.06];

let mapa = null;
let marcadorMoto = null;
let marcadorOrigem = null;
let marcadorDestino = null;
let rotaLayer = null;

let usuario = null;          // { id, nome, tipo }
let motoristaId = null;      // id da entidade Motorista
let online = false;
let corridaAtual = null;
let corridaSelecionada = null; // corrida que apareceu para aceitar
let intervaloBusca = null;
let modoOffline = false;

// ===== LOGIN =====
async function fazerLogin(e) {
  e.preventDefault();
  const login = document.getElementById('login').value.trim();
  const senha = document.getElementById('senha').value;

  if (!login || !senha) {
    toast('Preencha login e senha');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha })
    });
    const data = await res.json();

    if (data.sucesso) {
      if (data.tipo !== 'MOTORISTA') {
        toast('Este login é de cliente. Use a tela do cliente.');
        return;
      }
      usuario = { id: data.id, nome: data.nome, tipo: data.tipo };
      await carregarMotoristaId();
      entrarApp();
      return;
    }
    toast(data.mensagem || 'Login inválido');
  } catch (err) {
    // Fallback demo
    modoOffline = true;
    usuario = { id: 2, nome: login === 'carlos' ? 'Carlos Mendes' : login === 'pedro' ? 'Pedro Lima' : 'João Silva', tipo: 'MOTORISTA' };
    motoristaId = login === 'carlos' ? 2 : login === 'pedro' ? 3 : 1;
    entrarApp();
    toast('Modo demonstração (backend offline)');
  }
}

async function carregarMotoristaId() {
  try {
    const res = await fetch(`${API_URL}/motoristas`);
    if (res.ok) {
      const lista = await res.json();
      const m = lista.find(m => m.usuario && m.usuario.id === usuario.id);
      if (m) {
        motoristaId = m.id;
        // Atualiza posição inicial no mapa
        if (m.latitude && m.longitude) {
          // será usado depois
        }
      }
    }
  } catch (e) {
    motoristaId = 1;
  }
}

function entrarApp() {
  document.getElementById('tela-login').classList.remove('ativa');
  document.getElementById('tela-app').classList.add('ativa');
  document.getElementById('nome-moto').textContent = usuario.nome;
  setTimeout(() => {
    iniciarMapa();
    atualizarUIStatus();
  }, 100);
}

function logout() {
  pararBusca();
  if (online && motoristaId && !modoOffline) {
    atualizarStatusMotorista('OFFLINE');
  }
  online = false;
  usuario = null;
  motoristaId = null;
  corridaAtual = null;
  document.getElementById('tela-app').classList.remove('ativa');
  document.getElementById('tela-login').classList.add('ativa');
  if (mapa) { mapa.remove(); mapa = null; }
}

// ===== MAPA =====
function iniciarMapa() {
  if (mapa) mapa.remove();

  mapa = L.map('mapa', { zoomControl: false }).setView(CENTRO, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(mapa);
  L.control.zoom({ position: 'bottomright' }).addTo(mapa);

  // Marcador do próprio moto
  const icon = L.divIcon({
    className: '',
    html: '<div class="marcador-moto-inner">🛵</div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
  marcadorMoto = L.marker(CENTRO, { icon }).addTo(mapa).bindPopup('Você está aqui');
}

// ===== STATUS ONLINE/OFFLINE =====
function alternarStatus() {
  online = !online;
  atualizarUIStatus();

  if (online) {
    atualizarStatusMotorista('LIVRE');
    buscarCorridas();
    intervaloBusca = setInterval(buscarCorridas, 4000);
    toast('Você está online!');
  } else {
    pararBusca();
    atualizarStatusMotorista('OFFLINE');
    mostrarPainel('livre');
    document.getElementById('lista-corridas').innerHTML = `
      <div class="vazio">
        <i class="fas fa-motorcycle"></i>
        <p>Você está offline</p>
        <small>Fique online para receber corridas</small>
      </div>`;
    toast('Você ficou offline');
  }
}

function atualizarUIStatus() {
  const bolinha = document.getElementById('status-bolinha');
  const texto = document.getElementById('status-texto');
  const btn = document.getElementById('btn-status');

  if (corridaAtual) {
    bolinha.className = 'status-bolinha ocupado';
    texto.textContent = 'Em corrida';
    btn.textContent = 'Em corrida';
    btn.className = 'btn-status';
    btn.disabled = true;
  } else if (online) {
    bolinha.className = 'status-bolinha online';
    texto.textContent = 'Online – disponível';
    btn.textContent = 'Ficar Offline';
    btn.className = 'btn-status online';
    btn.disabled = false;
  } else {
    bolinha.className = 'status-bolinha';
    texto.textContent = 'Offline';
    btn.textContent = 'Ficar Online';
    btn.className = 'btn-status';
    btn.disabled = false;
  }
}

async function atualizarStatusMotorista(status) {
  if (modoOffline || !motoristaId) return;
  try {
    await fetch(`${API_URL}/motoristas/${motoristaId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch (e) {}
}

// ===== BUSCAR CORRIDAS =====
async function buscarCorridas() {
  if (!online || corridaAtual) return;

  if (modoOffline) {
    // Em modo offline não há corridas reais
    return;
  }

  try {
    const res = await fetch(`${API_URL}/corridas/solicitadas`);
    if (!res.ok) return;
    const lista = await res.json();

    const container = document.getElementById('lista-corridas');

    if (!lista || lista.length === 0) {
      container.innerHTML = `
        <div class="vazio">
          <i class="fas fa-motorcycle"></i>
          <p>Nenhuma corrida no momento</p>
          <small>Aguardando solicitações...</small>
        </div>`;
      return;
    }

    // Se só tem 1, mostra painel de aceitar direto
    if (lista.length === 1 && !corridaSelecionada) {
      mostrarNovaCorrida(lista[0]);
      return;
    }

    // Lista várias
    container.innerHTML = lista.map(c => `
      <div class="card-corrida" onclick="selecionarCorrida(${c.id})">
        <div class="enderecos">
          <strong>${c.origemEndereco || 'Origem'}</strong>
          <small>→ ${c.destinoEndereco || 'Destino'}</small>
        </div>
        <div class="rodape">
          <span>${c.distanciaKm ? c.distanciaKm.toFixed(1) + ' km' : '—'}</span>
          <span class="preco">${formatar(c.valorEstimado)}</span>
        </div>
      </div>
    `).join('');

  } catch (e) {
    console.warn('Erro ao buscar corridas', e);
  }
}

function selecionarCorrida(id) {
  // Busca detalhes e mostra painel de aceitar
  fetch(`${API_URL}/corridas/${id}`)
    .then(r => r.json())
    .then(c => mostrarNovaCorrida(c))
    .catch(() => toast('Erro ao carregar corrida'));
}

function mostrarNovaCorrida(corrida) {
  corridaSelecionada = corrida;

  document.getElementById('nova-origem').textContent = corrida.origemEndereco || '—';
  document.getElementById('nova-destino').textContent = corrida.destinoEndereco || '—';
  document.getElementById('nova-distancia').textContent =
    corrida.distanciaKm ? corrida.distanciaKm.toFixed(1) + ' km' : '—';
  document.getElementById('nova-valor').textContent = formatar(corrida.valorEstimado);
  document.getElementById('nova-pagamento').textContent = corrida.formaPagamento || '—';

  // Desenha no mapa
  limparRota();
  if (corrida.origemLat && corrida.origemLng) {
    const orig = [corrida.origemLat, corrida.origemLng];
    const dest = corrida.destinoLat ? [corrida.destinoLat, corrida.destinoLng] : null;

    marcadorOrigem = L.marker(orig, {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:#00c853;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(mapa);

    if (dest) {
      marcadorDestino = L.marker(dest, {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#e53935;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(mapa);
      rotaLayer = L.polyline([orig, dest], { color: '#00c853', weight: 4, dashArray: '8,8' }).addTo(mapa);
      mapa.fitBounds([orig, dest], { padding: [50, 50] });
    } else {
      mapa.setView(orig, 15);
    }
  }

  mostrarPainel('nova');
  toast('Nova corrida disponível!');
  if (typeof Sons !== "undefined") Sons.novaCorrida();
}

// ===== ACEITAR / RECUSAR =====
async function aceitarCorrida() {
  if (!corridaSelecionada) return;

  if (modoOffline) {
    corridaAtual = corridaSelecionada;
    entrarEmCorrida();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/corridas/${corridaSelecionada.id}/aceitar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motoristaId })
    });

    if (!res.ok) {
      const err = await res.json();
      toast(err.erro || 'Não foi possível aceitar');
      corridaSelecionada = null;
      mostrarPainel('livre');
      buscarCorridas();
      return;
    }

    corridaAtual = await res.json();
    entrarEmCorrida();
  } catch (e) {
    toast('Erro de conexão');
  }
}

function recusarCorrida() {
  corridaSelecionada = null;
  limparRota();
  mostrarPainel('livre');
  buscarCorridas();
  toast('Corrida recusada');
}

function entrarEmCorrida() {
  pararBusca();
  corridaSelecionada = null;

  document.getElementById('cliente-nome').textContent =
    corridaAtual.cliente?.nome || 'Cliente';
  document.getElementById('cliente-pagamento').textContent =
    'Pagamento: ' + (corridaAtual.formaPagamento || '—');
  document.getElementById('em-origem').textContent = corridaAtual.origemEndereco || '—';
  document.getElementById('em-destino').textContent = corridaAtual.destinoEndereco || '—';
  document.getElementById('em-valor').textContent = formatar(corridaAtual.valorEstimado);

  // Botões de fluxo
  document.getElementById('btn-cheguei').style.display = 'flex';
  document.getElementById('btn-iniciar').style.display = 'none';
  document.getElementById('btn-finalizar').style.display = 'none';

  mostrarPainel('em-corrida');
  atualizarUIStatus();
  toast('Corrida aceita! Vá até o cliente.');
  if (typeof Sons !== "undefined") Sons.corridaAceita();

  // Atualiza status para A_CAMINHO
  atualizarStatusCorrida('A_CAMINHO');
}

// ===== FLUXO DA CORRIDA =====
async function marcarCheguei() {
  document.getElementById('btn-cheguei').style.display = 'none';
  document.getElementById('btn-iniciar').style.display = 'flex';
  toast('Você chegou! Aguarde o cliente.');
  if (typeof Sons !== "undefined") Sons.motoChegou();
}

async function iniciarViagem() {
  await atualizarStatusCorrida('EM_VIAGEM');
  document.getElementById('btn-iniciar').style.display = 'none';
  document.getElementById('btn-finalizar').style.display = 'flex';
  toast('Viagem iniciada!');
}

async function finalizarCorrida() {
  await atualizarStatusCorrida('FINALIZADA');
  toast('Corrida finalizada! Valor: ' + formatar(corridaAtual.valorEstimado));
  if (typeof Sons !== "undefined") Sons.corridaFinalizada();

  corridaAtual = null;
  limparRota();
  mostrarPainel('livre');
  atualizarUIStatus();

  if (online) {
    intervaloBusca = setInterval(buscarCorridas, 4000);
    buscarCorridas();
  }
}

async function cancelarComoMotorista() {
  if (!corridaAtual) return;

  if (!modoOffline) {
    try {
      await fetch(`${API_URL}/corridas/${corridaAtual.id}/cancelar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Cancelado pelo mototaxista' })
      });
    } catch (e) {}
  }

  corridaAtual = null;
  limparRota();
  mostrarPainel('livre');
  atualizarUIStatus();
  toast('Corrida cancelada');
  if (typeof Sons !== "undefined") Sons.aviso();

  if (online) {
    intervaloBusca = setInterval(buscarCorridas, 4000);
    buscarCorridas();
  }
}

async function atualizarStatusCorrida(status) {
  if (modoOffline || !corridaAtual) return;
  try {
    const res = await fetch(`${API_URL}/corridas/${corridaAtual.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) corridaAtual = await res.json();
  } catch (e) {}
}

// ===== HELPERS =====
function mostrarPainel(nome) {
  document.querySelectorAll('.painel-conteudo').forEach(p => p.classList.remove('ativo'));
  const map = { livre: 'painel-livre', nova: 'painel-nova', 'em-corrida': 'painel-em-corrida' };
  document.getElementById(map[nome]).classList.add('ativo');
}

function limparRota() {
  if (marcadorOrigem) { mapa.removeLayer(marcadorOrigem); marcadorOrigem = null; }
  if (marcadorDestino) { mapa.removeLayer(marcadorDestino); marcadorDestino = null; }
  if (rotaLayer) { mapa.removeLayer(rotaLayer); rotaLayer = null; }
}

function pararBusca() {
  if (intervaloBusca) {
    clearInterval(intervaloBusca);
    intervaloBusca = null;
  }
}

function formatar(v) {
  if (v == null) return 'R$ 0,00';
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('mostrar');
  setTimeout(() => el.classList.remove('mostrar'), 2800);
}
