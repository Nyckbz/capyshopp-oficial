// ===== Dados =====
const TAMANHOS = ['P', 'M', 'G', 'GG'];
const PADRAO = [
  { id: 1, nome: 'Camiseta básica algodão', cat: 'Camisetas', preco: 59.9, estoque: { P: 10, M: 14, G: 8, GG: 3 }, img: 'img/camiseta-basica.jpg' },
  { id: 2, nome: 'Camiseta oversized', cat: 'Camisetas', preco: 79.9, estoque: { P: 4, M: 6, G: 6, GG: 0 }, img: 'img/camiseta-oversized.jpg', ajuste: 'contain' },
  { id: 3, nome: 'Regata canelada', cat: 'Camisetas', preco: 44.9, estoque: { P: 7, M: 9, G: 5, GG: 2 }, img: 'img/regata-canelada.jpg' },
  { id: 4, nome: 'Calça jeans reta', cat: 'Calças', preco: 169.9, estoque: { P: 3, M: 8, G: 8, GG: 4 }, img: 'img/calca-jeans-reta.jpg' },
  { id: 5, nome: 'Calça de alfaiataria', cat: 'Calças', preco: 199.9, estoque: { P: 2, M: 5, G: 3, GG: 0 }, img: 'img/calca-alfaiataria.jpg' },
  { id: 6, nome: 'Bermuda de sarja', cat: 'Bermudas', preco: 109.9, estoque: { P: 6, M: 10, G: 7, GG: 5 }, img: 'img/bermuda-polo.jpg' },
  { id: 7, nome: 'Vestido midi floral', cat: 'Vestidos', preco: 189.9, estoque: { P: 3, M: 4, G: 2, GG: 1 }, img: 'img/vestido-midi-floral.jpg' },
  { id: 8, nome: 'Vestido linho curto', cat: 'Vestidos', preco: 149.9, estoque: { P: 0, M: 0, G: 0, GG: 0 }, img: 'img/vestido-curto.jpg' },
  { id: 9, nome: 'Jaqueta jeans', cat: 'Casacos', preco: 259.9, estoque: { P: 2, M: 4, G: 4, GG: 2 }, img: 'img/jaqueta-jeans.jpg' },
  { id: 10, nome: 'Moletom com capuz', cat: 'Casacos', preco: 179.9, estoque: { P: 5, M: 9, G: 9, GG: 6 }, img: 'img/moletom-capuz.jpg' },
  { id: 11, nome: 'Blusa de tricô', cat: 'Casacos', preco: 139.9, estoque: { P: 4, M: 4, G: 2, GG: 0 }, img: 'img/blusa-trico.jpg', ajuste: 'contain' },
  { id: 12, nome: 'Macacão pantalona azul-marinho', cat: 'Macacões', preco: 219.9, estoque: { P: 8, M: 8, G: 4, GG: 1 }, img: 'img/macacao-azul.jpg' },
];
const CUPONS = { PRIMEIRA10: 0.10, PREMIUM: 0.20 };
const FRETE = 24.9, FRETE_GRATIS = 300;

// ===== Utilidades =====
const $ = s => document.querySelector(s);
const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const imagem = p => p.img
  ? `<img src="${esc(p.img)}" alt="${esc(p.nome)}">`
  : `<span aria-hidden="true">${p.emoji || '👕'}</span>`;
const ler = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };

let produtos = ler('np_produtos_v5', structuredClone(PADRAO));
let carrinho = ler('np_carrinho', {});
let cupomAtivo = ler('np_cupom', false);
let categoria = 'Todos';
const escolhido = {};

const salvar = () => {
  localStorage.setItem('np_produtos_v5', JSON.stringify(produtos));
  localStorage.setItem('np_carrinho', JSON.stringify(carrinho));
  localStorage.setItem('np_cupom', JSON.stringify(cupomAtivo));
};
const achar = id => produtos.find(p => p.id === Number(id));
const dividir = chave => { const [id, tam] = chave.split('|'); return [achar(id), tam]; };
const estoqueTotal = p => Object.values(p.estoque).reduce((a, b) => a + b, 0);

function sanear() {
  if (cupomAtivo && !Object.hasOwn(CUPONS, cupomAtivo)) cupomAtivo = false;
  for (const chave of Object.keys(carrinho)) {
    const [p, tam] = dividir(chave);
    const disp = p ? (p.estoque[tam] || 0) : 0;
    if (disp === 0) delete carrinho[chave];
    else carrinho[chave] = Math.min(carrinho[chave], disp);
  }
}

// ===== Vitrine =====
function renderCategorias() {
  const cats = ['Todos', ...new Set(produtos.map(p => p.cat))];
  if (!cats.includes(categoria)) categoria = 'Todos';
  $('#categorias').innerHTML = cats.map(c =>
    `<button data-cat="${esc(c)}" class="${c === categoria ? 'ativa' : ''}">${esc(c)}</button>`).join('');
}

function renderGrade() {
  const termo = $('#busca').value.trim().toLowerCase();
  const ordem = $('#ordem').value;
  const lista = produtos.filter(p =>
    (categoria === 'Todos' || p.cat === categoria) && p.nome.toLowerCase().includes(termo));
  lista.sort((a, b) => ordem === 'menor' ? a.preco - b.preco : ordem === 'maior' ? b.preco - a.preco : a.nome.localeCompare(b.nome));

  $('#grade').innerHTML = lista.length ? lista.map(p => {
    const sel = escolhido[p.id];
    const disp = sel ? p.estoque[sel] - (carrinho[`${p.id}|${sel}`] || 0) : 0;
    let aviso = '', cls = '';
    if (estoqueTotal(p) === 0) { aviso = 'Esgotado'; cls = 'zero'; }
    else if (sel) {
      const e = p.estoque[sel];
      aviso = e <= 3 ? `Tamanho ${sel}: últimas ${e} unidades` : `Tamanho ${sel}: ${e} em estoque`;
      cls = e <= 3 ? 'baixo' : '';
    }
    const tag = estoqueTotal(p) === 0 ? '<span class="tag esgotado">Esgotado</span>' : estoqueTotal(p) <= 8 ? '<span class="tag">Poucas unidades</span>' : '';
    const botao = estoqueTotal(p) === 0 ? 'Indisponível' : !sel ? 'Escolha um tamanho' : disp <= 0 ? 'Limite na sacola' : 'Adicionar à sacola';
    return `<article class="card">
      <div class="foto${p.ajuste === 'contain' ? ' contida' : ''}${estoqueTotal(p) === 0 ? ' esgotada' : ''}">${imagem(p)}${tag}</div>
      <div class="corpo">
        <h3>${esc(p.nome)}</h3>
        <span class="cat">${esc(p.cat)}</span>
        <div class="tamanhos" role="group" aria-label="Tamanhos">
          ${TAMANHOS.map(t => `<button data-tam="${t}" data-id="${p.id}" class="${sel === t ? 'sel' : ''}" ${p.estoque[t] > 0 ? '' : 'disabled'}>${t}</button>`).join('')}
        </div>
        <span class="estoque ${cls}">${aviso}</span>
        <span class="preco">${brl(p.preco)}</span>
        <button class="principal" data-add="${p.id}" ${!sel || disp <= 0 ? 'disabled' : ''}>${botao}</button>
      </div>
    </article>`;
  }).join('') : '<p class="vazio">Nenhuma peça encontrada. Tente outra busca ou categoria.</p>';
}

// ===== Sacola =====
function calcular() {
  const subtotal = Object.entries(carrinho).reduce((s, [k, q]) => s + dividir(k)[0].preco * q, 0);
  const desconto = subtotal * (CUPONS[cupomAtivo] || 0);
  const frete = subtotal === 0 || subtotal - desconto >= FRETE_GRATIS ? 0 : FRETE;
  return { subtotal, desconto, frete, total: subtotal - desconto + frete };
}

function renderCarrinho() {
  const chaves = Object.keys(carrinho);
  $('#contador').textContent = chaves.reduce((s, k) => s + carrinho[k], 0);
  $('#itens').innerHTML = chaves.length ? chaves.map(k => {
    const [p, tam] = dividir(k), q = carrinho[k];
    return `<div class="item">
      <div class="mini${p.ajuste === 'contain' ? ' contida' : ''}">${imagem(p)}</div>
      <div>${esc(p.nome)}<small>Tamanho ${tam} · ${brl(p.preco)} cada</small>
        <div class="qtd">
          <button data-menos="${k}" aria-label="Diminuir">−</button>
          <span>${q}</span>
          <button data-mais="${k}" aria-label="Aumentar" ${q >= p.estoque[tam] ? 'disabled' : ''}>+</button>
          <button class="remover" data-remover="${k}">Remover</button>
        </div>
      </div>
      <strong>${brl(p.preco * q)}</strong>
    </div>`;
  }).join('') : '<p class="msg">Sua sacola está vazia. Escolha um tamanho e adicione uma peça.</p>';

  const t = calcular();
  $('#totais').innerHTML = `
    <dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd>
    ${cupomAtivo ? `<dt>Cupom ${cupomAtivo}</dt><dd>− ${brl(t.desconto)}</dd>` : ''}
    <dt>Frete</dt><dd>${t.frete ? brl(t.frete) : 'Grátis'}</dd>
    <dt class="total">Total</dt><dd class="total">${brl(t.total)}</dd>`;
  $('#btnFinalizar').disabled = chaves.length === 0;
}

function atualizar() {
  sanear(); salvar();
  renderCategorias(); renderGrade(); renderCarrinho();
}

const abrirCarrinho = abrir => {
  $('#gaveta').classList.toggle('aberta', abrir);
  $('#fundo').classList.toggle('aberto', abrir);
};

function mudarQtd(chave, delta) {
  const [p, tam] = dividir(chave);
  const nova = (carrinho[chave] || 0) + delta;
  if (nova <= 0) delete carrinho[chave];
  else if (nova <= p.estoque[tam]) carrinho[chave] = nova;
  atualizar();
}

// ===== Eventos =====
$('#busca').addEventListener('input', renderGrade);
$('#ordem').addEventListener('change', renderGrade);
$('#categorias').addEventListener('click', e => {
  if (e.target.dataset.cat) { categoria = e.target.dataset.cat; renderCategorias(); renderGrade(); }
});
$('#grade').addEventListener('click', e => {
  const d = e.target.dataset;
  if (d.tam) { escolhido[d.id] = d.tam; renderGrade(); }
  if (d.add && escolhido[d.add]) { mudarQtd(`${d.add}|${escolhido[d.add]}`, 1); abrirCarrinho(true); }
});
$('#itens').addEventListener('click', e => {
  const d = e.target.dataset;
  if (d.mais) mudarQtd(d.mais, 1);
  if (d.menos) mudarQtd(d.menos, -1);
  if (d.remover) { delete carrinho[d.remover]; atualizar(); }
});
$('#btnCarrinho').addEventListener('click', () => abrirCarrinho(true));
$('#fechar').addEventListener('click', () => abrirCarrinho(false));
$('#fundo').addEventListener('click', () => abrirCarrinho(false));

function aplicarCupom(codigo) {
  const c = codigo.trim().toUpperCase();
  const ok = Object.hasOwn(CUPONS, c);
  cupomAtivo = ok ? c : false;
  if (ok) $('#cupom').value = c;
  $('#msgCupom').className = 'msg ' + (ok ? 'ok' : 'erro');
  $('#msgCupom').textContent = ok ? `Cupom ${c} aplicado: ${Math.round(CUPONS[c] * 100)}% de desconto.` : 'Cupom inválido. Confira o código e tente de novo.';
  atualizar();
  return ok;
}
$('#aplicarCupom').addEventListener('click', () => aplicarCupom($('#cupom').value));

// ===== Finalizar compra =====
document.querySelectorAll('[data-fechar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

$('#btnFinalizar').addEventListener('click', () => {
  $('#resumoCheckout').className = 'msg';
  $('#resumoCheckout').textContent = `Total do pedido: ${brl(calcular().total)}`;
  $('#dlgCheckout').showModal();
});

$('#formCheckout').addEventListener('submit', e => {
  e.preventDefault();
  for (const [k, q] of Object.entries(carrinho)) {
    const [p, tam] = dividir(k);
    if (p.estoque[tam] < q) {
      $('#resumoCheckout').className = 'msg erro';
      $('#resumoCheckout').textContent = `Estoque insuficiente para "${p.nome}" (${tam}). Ajuste a sacola.`;
      return;
    }
  }
  const total = calcular().total;
  const nome = new FormData(e.target).get('nome');
  for (const [k, q] of Object.entries(carrinho)) { const [p, tam] = dividir(k); p.estoque[tam] -= q; }
  carrinho = {}; cupomAtivo = false;
  const numero = 'NP-' + Math.floor(100000 + Math.random() * 900000);
  atualizar();
  e.target.reset();
  $('#dlgCheckout').close();
  abrirCarrinho(false);
  $('#txtPedido').textContent = `Obrigado, ${nome}! O pedido ${numero} (${brl(total)}) foi registrado e o estoque foi atualizado.`;
  $('#dlgPedido').showModal();
});

// ===== Painel de estoque =====
function renderTabela() {
  $('#tabela').innerHTML = `<tr><th>Peça</th><th>Categoria</th><th>Preço (R$)</th>${TAMANHOS.map(t => `<th>${t}</th>`).join('')}<th></th></tr>` +
    produtos.map(p => `<tr>
      <td><input class="nome" value="${esc(p.nome)}" data-id="${p.id}" data-campo="nome"></td>
      <td><input value="${esc(p.cat)}" data-id="${p.id}" data-campo="cat"></td>
      <td><input type="number" min="0" step="0.01" value="${p.preco}" data-id="${p.id}" data-campo="preco"></td>
      ${TAMANHOS.map(t => `<td><input type="number" min="0" step="1" value="${p.estoque[t] || 0}" data-id="${p.id}" data-campo="${t}"></td>`).join('')}
      <td><button class="remover" data-excluir="${p.id}">Excluir</button></td>
    </tr>`).join('');
}

$('#btnEstoque').addEventListener('click', () => { renderTabela(); $('#dlgEstoque').showModal(); });

$('#tabela').addEventListener('change', e => {
  const { id, campo } = e.target.dataset;
  if (!id) return;
  const p = achar(id);
  const v = e.target.value;
  if (TAMANHOS.includes(campo)) p.estoque[campo] = Math.max(0, parseInt(v, 10) || 0);
  else if (campo === 'preco') p.preco = Math.max(0, parseFloat(v) || 0);
  else if (v.trim()) p[campo] = v.trim();
  else renderTabela();
  atualizar();
});

$('#tabela').addEventListener('click', e => {
  if (!e.target.dataset.excluir) return;
  produtos = produtos.filter(p => p.id !== Number(e.target.dataset.excluir));
  atualizar(); renderTabela();
});

$('#formNovo').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  produtos.push({
    id: Date.now(), nome: f.get('nome').trim(), cat: f.get('cat').trim(),
    preco: Math.max(0, parseFloat(f.get('preco')) || 0),
    estoque: Object.fromEntries(TAMANHOS.map(t => [t, Math.max(0, parseInt(f.get(t), 10) || 0)])),
    emoji: '👕', cor: '#e6eaf2',
  });
  e.target.reset();
  atualizar(); renderTabela();
});

$('#restaurar').addEventListener('click', () => {
  if (!confirm('Restaurar as peças de exemplo? Suas alterações de estoque serão perdidas.')) return;
  produtos = structuredClone(PADRAO); carrinho = {}; cupomAtivo = false;
  atualizar(); renderTabela();
});

// ===== Aviso rápido =====
let tempoAviso;
function toast(texto) {
  const el = $('#toast');
  el.textContent = texto;
  el.classList.add('visivel');
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(() => el.classList.remove('visivel'), 3000);
}

// ===== Cabeçalho: busca e ajuda =====
$('#btnBusca').addEventListener('click', () => {
  const barra = $('#barraBusca');
  barra.classList.toggle('aberta');
  if (barra.classList.contains('aberta')) $('#busca').focus();
});
$('#btnAjuda').addEventListener('click', () => $('#dlgAjuda').showModal());

// ===== Carrossel de banners =====
const faixa = $('#faixa');
const slides = [...document.querySelectorAll('.slide')];
const pontos = $('#pontos');
let atual = 0, timer;

pontos.innerHTML = slides.map((_, i) => `<button data-i="${i}" aria-label="Ir para o banner ${i + 1}"></button>`).join('');

function ir(i) {
  atual = (i + slides.length) % slides.length;
  faixa.style.transform = `translateX(-${atual * 100}%)`;
  slides.forEach((sl, n) => { sl.inert = n !== atual; });
  [...pontos.children].forEach((b, n) => b.classList.toggle('ativo', n === atual));
}
function parar() { clearInterval(timer); }
function iniciar() {
  parar();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => ir(atual + 1), 6000);
}

$('#anterior').addEventListener('click', () => { ir(atual - 1); iniciar(); });
$('#proximo').addEventListener('click', () => { ir(atual + 1); iniciar(); });
pontos.addEventListener('click', e => { if (e.target.dataset.i) { ir(Number(e.target.dataset.i)); iniciar(); } });
$('#carrossel').addEventListener('mouseenter', parar);
$('#carrossel').addEventListener('mouseleave', iniciar);
$('#carrossel').addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { ir(atual - 1); iniciar(); }
  if (e.key === 'ArrowRight') { ir(atual + 1); iniciar(); }
});

// Botões dos banners: aplicar cupom ou abrir uma categoria
faixa.addEventListener('click', e => {
  const b = e.target.closest('[data-acao]');
  if (!b) return;
  if (b.dataset.acao === 'cupom') {
    aplicarCupom(b.dataset.cupom);
    toast(`Cupom ${b.dataset.cupom} aplicado. O desconto aparece na sua sacola.`);
  }
  if (b.dataset.acao === 'categoria') {
    categoria = b.dataset.cat;
    renderCategorias(); renderGrade();
  }
  $('#vitrine').scrollIntoView({ behavior: 'smooth' });
});

ir(0);
iniciar();
atualizar();