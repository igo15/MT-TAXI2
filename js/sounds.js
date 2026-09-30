/**
 * Notificações sonoras do Moto Táxi Araçuaí
 * Usa Web Audio API (sem arquivos externos)
 */
const Sons = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Alguns navegadores suspendem o áudio até interação do usuário
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  /** Toca uma nota simples */
  function nota(freq, duracao, tipo = 'sine', volume = 0.3, delay = 0) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = tipo;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, c.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duracao);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + duracao + 0.05);
    } catch (e) {
      console.warn('Áudio não disponível', e);
    }
  }

  /** Sequência de notas */
  function sequencia(notas) {
    // notas = [{ freq, dur, tipo?, vol?, delay? }, ...]
    notas.forEach(n => {
      nota(n.freq, n.dur || 0.15, n.tipo || 'sine', n.vol || 0.3, n.delay || 0);
    });
  }

  // ===== SONS ESPECÍFICOS =====

  /** Corrida aceita pelo mototaxista */
  function corridaAceita() {
    sequencia([
      { freq: 523, dur: 0.12, delay: 0 },      // Dó
      { freq: 659, dur: 0.12, delay: 0.12 },  // Mi
      { freq: 784, dur: 0.25, delay: 0.24 }   // Sol
    ]);
  }

  /** Mototaxista chegou no local do cliente */
  function motoChegou() {
    sequencia([
      { freq: 880, dur: 0.15, delay: 0, tipo: 'triangle' },
      { freq: 880, dur: 0.15, delay: 0.2, tipo: 'triangle' },
      { freq: 1175, dur: 0.3, delay: 0.4, tipo: 'triangle', vol: 0.35 }
    ]);
  }

  /** Cliente chegou ao destino / corrida finalizada */
  function corridaFinalizada() {
    sequencia([
      { freq: 523, dur: 0.12, delay: 0 },
      { freq: 659, dur: 0.12, delay: 0.13 },
      { freq: 784, dur: 0.12, delay: 0.26 },
      { freq: 1047, dur: 0.4, delay: 0.4, vol: 0.35 }
    ]);
  }

  /** Nova corrida disponível (para o mototaxista) */
  function novaCorrida() {
    sequencia([
      { freq: 700, dur: 0.18, delay: 0, tipo: 'square', vol: 0.2 },
      { freq: 700, dur: 0.18, delay: 0.25, tipo: 'square', vol: 0.2 },
      { freq: 900, dur: 0.3, delay: 0.5, tipo: 'square', vol: 0.25 }
    ]);
  }

  /** Aviso genérico / cancelamento */
  function aviso() {
    sequencia([
      { freq: 400, dur: 0.2, delay: 0, tipo: 'sawtooth', vol: 0.2 },
      { freq: 300, dur: 0.3, delay: 0.22, tipo: 'sawtooth', vol: 0.2 }
    ]);
  }

  return {
    corridaAceita,
    motoChegou,
    corridaFinalizada,
    novaCorrida,
    aviso
  };
})();
