/* Psimeta: versão de demonstração.
   Tudo roda no navegador e os dados ficam salvos só neste aparelho (localStorage). */
(function () {
  'use strict';

  const KEY = 'rhps-consultorio-demo-v1';
  const STATUS = {
    agendada: 'Aguardando',
    confirmada: 'Confirmada',
    realizada: 'Realizada',
    falta: 'Faltou',
    cancelada: 'Cancelada'
  };
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const ICONS = {
    agenda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    pacientes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M22 21a6 6 0 0 0-4-5.6"/></svg>',
    financeiro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    config: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>'
  };
  const NAV = [
    ['agenda', 'Agenda'],
    ['pacientes', 'Pacientes'],
    ['financeiro', 'Financeiro'],
    ['config', 'Configurações']
  ];

  /* ---------- utilidades ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const todayIso = () => iso(new Date());
  const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7)); // semana começa na segunda
  const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (s) => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const fmtDateLong = (s) => { const d = parse(s); return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const fmtPhone = (s) => { const d = digits(s); if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return s || ''; };
  const waLink = (phone, text) => { let d = digits(phone); if (d && !d.startsWith('55')) d = '55' + d; return `https://wa.me/${d}?text=${encodeURIComponent(text)}`; };
  const firstName = (n) => (n || '').split(' ')[0];

  /* ---------- dados ---------- */
  let db;

  function seed() {
    const settings = {
      nome: 'Dra. Ana Ribeiro',
      crp: '06/123456',
      cpf: '',
      cidade: 'São José do Rio Preto - SP',
      valor: 180,
      pix: 'ana.ribeiro@email.com',
      lembrete: 'Oi, {paciente}! Passando para lembrar da sua sessão {dia} às {hora}. Responda 1 para confirmar ou 2 para remarcar. {link}',
      cobranca: 'Oi, {paciente}! Segue o valor das sessões em aberto: {valor}. Chave Pix: {pix}. Qualquer dúvida, estou à disposição.'
    };
    const people = [
      ['Mariana Souza', '17991230001', 180, 'Ansiedade generalizada, encaminhada pelo clínico geral.', 1, '08:00', 'presencial', 7],
      ['Pedro Almeida', '17991230002', 180, 'Busca acompanhamento após mudança de cidade e emprego.', 2, '09:00', 'online', 7],
      ['Juliana Martins', '17991230003', 160, 'Luto recente. Prefere sessões no começo da manhã.', 3, '10:30', 'presencial', 14],
      ['Carlos Ribeiro', '17991230004', 200, 'Estresse no trabalho e insônia.', 2, '14:00', 'presencial', 7],
      ['Fernanda Lima', '17991230005', 180, 'Autoconhecimento. Atendimento online por morar em outra cidade.', 4, '15:00', 'online', 7],
      ['Rafael Costa', '17991230006', 150, 'Adolescente, 16 anos. Responsável: mãe (Cláudia).', 5, '17:00', 'presencial', 7]
    ];
    const patients = [];
    const sessions = [];
    const notes = [];
    const today = new Date();
    const monday = startOfWeek(today);
    people.forEach(([nome, tel, valor, queixa, weekday, time, modal, step], i) => {
      const id = uid() + i;
      patients.push({
        id, nome, tel, email: nome.toLowerCase().split(' ')[0] + '@email.com', nasc: '', valor,
        anamnese: `Queixa principal: ${queixa}\n\nHistórico: primeira vez em psicoterapia.\n\nObjetivos combinados: reduzir sintomas, entender gatilhos e criar estratégias para o dia a dia.`,
        criado: iso(addDays(monday, -42))
      });
      for (let w = -5; w <= 3; w++) {
        if (step === 14 && w % 2 !== 0) continue;
        const date = iso(addDays(monday, w * 7 + (weekday - 1)));
        let status = 'agendada';
        let pago = false;
        if (date < todayIso()) {
          status = (i === 3 && w === -2) ? 'falta' : 'realizada';
          pago = !(i === 1 && w >= -2) && !(i === 3 && w === -1);
        } else if (date <= iso(addDays(today, 2))) {
          status = i % 2 === 0 ? 'agendada' : 'confirmada';
        }
        const s = { id: uid() + i + w, pid: id, date, time, dur: 50, modal, status, valor, pago, obs: '' };
        sessions.push(s);
        if (status === 'realizada' && w >= -2) {
          notes.push({ id: uid() + 'n' + i + w, pid: id, sid: s.id, date, text: [
            'Paciente chegou pontual e relatou uma semana mais tranquila. Trabalhamos a identificação de pensamentos automáticos em situações de trabalho.',
            'Retomamos a tarefa combinada na sessão anterior. Relata dificuldade em manter a rotina de sono. Combinamos registro diário.',
            'Sessão focada nas relações familiares. Demonstrou abertura para falar sobre o tema pela primeira vez.'
          ][(i + w + 6) % 3] });
        }
      }
    });
    return { settings, patients, sessions, notes, receipts: 0 };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { db = JSON.parse(raw); return; }
    } catch (e) { /* sem armazenamento: segue com dados de exemplo */ }
    db = seed();
    save();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignora */ }
  }
  const patient = (id) => db.patients.find((p) => p.id === id);
  const session = (id) => db.sessions.find((s) => s.id === id);
  const sortSes = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

  /* ---------- estado de tela ---------- */
  const ui = { weekStart: startOfWeek(new Date()), month: todayIso().slice(0, 7), search: '', tab: 'prontuario' };

  function toast(msg) {
    document.querySelectorAll('.toast').forEach((x) => x.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function fill(tpl, s) {
    const p = patient(s.pid) || {};
    return tpl
      .replace(/\{paciente\}/g, firstName(p.nome))
      .replace(/\{dia\}/g, s.date === iso(addDays(new Date(), 1)) ? 'amanhã' : s.date === todayIso() ? 'hoje' : `${WEEKDAYS_LONG[parse(s.date).getDay()]} (${fmtDate(s.date).slice(0, 5)})`)
      .replace(/\{hora\}/g, s.time.replace(':', 'h').replace('h00', 'h'))
      .replace(/\{link\}/g, s.modal === 'online' ? `Link da sessão: https://meet.google.com/abc-defg-hij` : '')
      .trim();
  }

  /* ---------- navegação ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, '') || 'agenda';
    const [page, arg] = h.split('/');
    return { page, arg };
  }
  function renderNav(page) {
    const active = page === 'paciente' ? 'pacientes' : page;
    const html = NAV.map(([id, label]) => `<a class="nav-link ${active === id ? 'active' : ''}" href="#${id}">${ICONS[id]}<span>${label}</span></a>`).join('');
    $('#side-nav').innerHTML = html;
    $('#bottom-nav').innerHTML = NAV.map(([id, label]) => `<a class="${active === id ? 'active' : ''}" href="#${id}">${ICONS[id]}<span>${label === 'Configurações' ? 'Ajustes' : label}</span></a>`).join('');
  }

  const demoBar = () => `<div class="demo-bar"><span>Modo demonstração: os dados são fictícios e ficam salvos só neste navegador.</span><button data-action="reset">Restaurar dados de exemplo</button></div>`;

  function render() {
    const { page, arg } = route();
    renderNav(page);
    const views = { agenda: viewAgenda, pacientes: viewPatients, paciente: () => viewPatient(arg), financeiro: viewFinance, config: viewConfig };
    $('#main').innerHTML = demoBar() + (views[page] || viewAgenda)();
    window.scrollTo(0, 0);
  }

  /* ---------- agenda ---------- */
  function viewAgenda() {
    const start = ui.weekStart;
    const end = addDays(start, 6);
    const t = todayIso();
    const todays = db.sessions.filter((s) => s.date === t && s.status !== 'cancelada');
    const pendingConfirm = db.sessions.filter((s) => s.date >= t && s.date <= iso(addDays(new Date(), 2)) && s.status === 'agendada');
    const month = t.slice(0, 7);
    const monthSes = db.sessions.filter((s) => s.date.startsWith(month));
    const received = monthSes.filter((s) => s.pago).reduce((a, s) => a + Number(s.valor), 0);
    const faltas = monthSes.filter((s) => s.status === 'falta').length;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const di = iso(d);
      const list = db.sessions.filter((s) => s.date === di).sort(sortSes);
      days.push(`<div class="day ${di === t ? 'today' : ''} ${list.length ? '' : 'no-ses'}">
        <div class="day-head"><span>${WEEKDAYS[d.getDay()]}</span><b>${d.getDate()}</b></div>
        ${list.map((s) => { const p = patient(s.pid); return `<button class="ses ${s.status}" data-action="open-session" data-id="${s.id}"><b>${esc(p ? p.nome : 'Paciente removido')}</b><span>${esc(s.time)} · ${STATUS[s.status]}${s.modal === 'online' ? ' · online' : ''}</span></button>`; }).join('')}
        <button class="day-add" data-action="new-session" data-date="${di}">+ Sessão</button>
      </div>`);
    }

    const range = start.getMonth() === end.getMonth()
      ? `${start.getDate()} a ${end.getDate()} de ${MONTHS[start.getMonth()]}`
      : `${start.getDate()} de ${MONTHS[start.getMonth()]} a ${end.getDate()} de ${MONTHS[end.getMonth()]}`;

    return `
      <div class="page-head">
        <div><h1>Agenda</h1><p class="muted small" style="margin:4px 0 0">${range}</p></div>
        <div class="actions">
          <button class="btn icon-btn" data-action="week" data-dir="-1" aria-label="Semana anterior">‹</button>
          <button class="btn" data-action="week" data-dir="0">Hoje</button>
          <button class="btn icon-btn" data-action="week" data-dir="1" aria-label="Próxima semana">›</button>
          <button class="btn btn-primary" data-action="new-session" data-date="${t}">+ Nova sessão</button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><small>Sessões hoje</small><b>${todays.length}</b></div>
        <div class="stat"><small>Sem confirmação (2 dias)</small><b>${pendingConfirm.length}</b></div>
        <div class="stat"><small>Recebido no mês</small><b>${brl(received)}</b></div>
        <div class="stat"><small>Faltas no mês</small><b>${faltas}</b></div>
      </div>
      ${pendingConfirm.length ? `<div class="card" style="margin-bottom:14px">
        <div class="card-head"><h2>Enviar lembretes</h2><span class="muted small">Sessões dos próximos 2 dias ainda sem confirmação</span></div>
        <div class="list">${pendingConfirm.sort(sortSes).map((s) => { const p = patient(s.pid) || {}; return `<div class="item"><div class="avatar">${esc(initials(p.nome || '?'))}</div><div class="grow"><b>${esc(p.nome)}</b><span>${esc(fmtDateLong(s.date))} às ${esc(s.time)}</span></div><a class="btn btn-wa btn-sm" href="${esc(waLink(p.tel, fill(db.settings.lembrete, s)))}" target="_blank" rel="noopener">WhatsApp</a><button class="btn btn-sm" data-action="set-status" data-id="${s.id}" data-status="confirmada">Confirmou</button></div>`; }).join('')}</div>
      </div>` : ''}
      <div class="week">${days.join('')}</div>`;
  }

  function sessionModal(id) {
    const s = session(id);
    if (!s) return;
    const p = patient(s.pid) || { nome: 'Paciente removido', tel: '' };
    const note = db.notes.find((n) => n.sid === s.id);
    openModal(`
      <div class="modal-head"><h2>${esc(p.nome)}</h2><button class="close" data-action="close" aria-label="Fechar">×</button></div>
      <dl class="kv">
        <dt>Quando</dt><dd>${esc(fmtDateLong(s.date))}, ${esc(s.time)} (${s.dur} min)</dd>
        <dt>Formato</dt><dd>${s.modal === 'online' ? 'Online' : 'Presencial'}</dd>
        <dt>Valor</dt><dd>${brl(s.valor)} <span class="tag ${s.pago ? 'pago' : 'pendente'}">${s.pago ? 'Pago' : 'Em aberto'}</span></dd>
        <dt>Telefone</dt><dd>${esc(fmtPhone(p.tel)) || '-'}</dd>
      </dl>
      <label>Status</label>
      <div class="status-pick">${Object.keys(STATUS).map((k) => `<button class="${s.status === k ? 'on' : ''}" data-action="set-status" data-id="${s.id}" data-status="${k}" data-keep="1">${STATUS[k]}</button>`).join('')}</div>
      <div class="field" style="margin-top:16px">
        <label for="ses-note">Evolução da sessão (prontuário)</label>
        <textarea id="ses-note" placeholder="Registre aqui o que foi trabalhado na sessão">${esc(note ? note.text : '')}</textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-danger" data-action="delete-session" data-id="${s.id}">Excluir</button>
        <a class="btn btn-wa" href="${esc(waLink(p.tel, fill(db.settings.lembrete, s)))}" target="_blank" rel="noopener">Lembrete no WhatsApp</a>
        <button class="btn" data-action="toggle-paid" data-id="${s.id}" data-keep="1">${s.pago ? 'Marcar em aberto' : 'Marcar como pago'}</button>
        ${s.pid && patient(s.pid) ? `<a class="btn" href="#paciente/${s.pid}" data-action="close-link">Ver paciente</a>` : ''}
        <button class="btn btn-primary" data-action="save-session-note" data-id="${s.id}">Salvar</button>
      </div>`);
  }

  function newSessionModal(date, pid) {
    if (!db.patients.length) { toast('Cadastre um paciente primeiro'); location.hash = 'pacientes'; return; }
    const first = pid ? patient(pid) : db.patients[0];
    openModal(`
      <div class="modal-head"><h2>Nova sessão</h2><button class="close" data-action="close" aria-label="Fechar">×</button></div>
      <form id="form-session">
        <div class="field"><label for="f-pid">Paciente</label>
          <select id="f-pid" name="pid" required>${db.patients.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => `<option value="${p.id}" ${p.id === first.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></div>
        <div class="row3">
          <div class="field"><label for="f-date">Data</label><input id="f-date" type="date" name="date" value="${esc(date)}" required></div>
          <div class="field"><label for="f-time">Horário</label><input id="f-time" type="time" name="time" value="09:00" required></div>
          <div class="field"><label for="f-dur">Duração (min)</label><input id="f-dur" type="number" name="dur" value="50" min="10" step="5"></div>
        </div>
        <div class="row">
          <div class="field"><label for="f-modal">Formato</label><select id="f-modal" name="modal"><option value="presencial">Presencial</option><option value="online">Online</option></select></div>
          <div class="field"><label for="f-valor">Valor (R$)</label><input id="f-valor" type="number" name="valor" value="${esc(first.valor || db.settings.valor)}" min="0" step="0.01"></div>
        </div>
        <div class="row">
          <div class="field"><label for="f-rep">Repetir</label><select id="f-rep" name="rep"><option value="0">Não repetir</option><option value="7" selected>Toda semana</option><option value="14">A cada 15 dias</option></select></div>
          <div class="field"><label for="f-qtd">Quantas sessões</label><input id="f-qtd" type="number" name="qtd" value="8" min="1" max="52"></div>
        </div>
        <div class="modal-foot"><button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary" type="submit">Agendar</button></div>
      </form>`);
    $('#f-pid').addEventListener('change', (e) => { const p = patient(e.target.value); if (p) $('#f-valor').value = p.valor || db.settings.valor; });
    $('#form-session').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const rep = Number(f.rep);
      const qtd = rep ? Math.min(52, Math.max(1, Number(f.qtd) || 1)) : 1;
      let conflicts = 0;
      for (let i = 0; i < qtd; i++) {
        const date = iso(addDays(parse(f.date), i * rep));
        if (db.sessions.some((s) => s.date === date && s.time === f.time && s.status !== 'cancelada')) conflicts++;
        db.sessions.push({ id: uid() + i, pid: f.pid, date, time: f.time, dur: Number(f.dur) || 50, modal: f.modal, status: 'agendada', valor: Number(f.valor) || 0, pago: false, obs: '' });
      }
      save();
      closeModal();
      ui.weekStart = startOfWeek(parse(f.date));
      if (route().page === 'agenda') render(); else location.hash = 'agenda';
      toast(qtd > 1 ? `${qtd} sessões agendadas` : 'Sessão agendada');
      if (conflicts) setTimeout(() => toast(`Atenção: ${conflicts} horário(s) já tinham outra sessão`), 2300);
    });
  }

  /* ---------- pacientes ---------- */
  function patientStats(pid) {
    const list = db.sessions.filter((s) => s.pid === pid);
    const done = list.filter((s) => s.status === 'realizada');
    const open = list.filter((s) => (s.status === 'realizada' || s.status === 'falta') && !s.pago);
    const next = list.filter((s) => s.date >= todayIso() && s.status !== 'cancelada').sort(sortSes)[0];
    return { list, done, open, owed: open.reduce((a, s) => a + Number(s.valor), 0), next };
  }

  function viewPatients() {
    const q = ui.search.trim().toLowerCase();
    const list = db.patients.filter((p) => !q || p.nome.toLowerCase().includes(q) || digits(p.tel).includes(digits(q) || '§')).sort((a, b) => a.nome.localeCompare(b.nome));
    return `
      <div class="page-head"><h1>Pacientes</h1><div class="actions"><button class="btn btn-primary" data-action="new-patient">+ Novo paciente</button></div></div>
      <div class="toolbar" style="margin-bottom:14px"><input class="search" id="search" type="search" placeholder="Buscar por nome ou telefone" value="${esc(ui.search)}" aria-label="Buscar paciente"></div>
      <div class="list">${list.length ? list.map((p) => { const st = patientStats(p.id); return `<a class="item" href="#paciente/${p.id}"><div class="avatar">${esc(initials(p.nome))}</div><div class="grow"><b>${esc(p.nome)}</b><span>${st.next ? `Próxima: ${esc(fmtDate(st.next.date))} às ${esc(st.next.time)}` : 'Sem sessão marcada'} · ${st.done.length} sessões realizadas</span></div>${st.owed ? `<span class="tag pendente">${brl(st.owed)} em aberto</span>` : ''}</a>`; }).join('') : '<div class="empty">Nenhum paciente encontrado.</div>'}</div>`;
  }

  function patientForm(p) {
    p = p || { nome: '', tel: '', email: '', nasc: '', valor: db.settings.valor, contato: '' };
    openModal(`
      <div class="modal-head"><h2>${p.id ? 'Editar paciente' : 'Novo paciente'}</h2><button class="close" data-action="close" aria-label="Fechar">×</button></div>
      <form id="form-patient">
        <div class="field"><label for="p-nome">Nome completo</label><input id="p-nome" name="nome" value="${esc(p.nome)}" required></div>
        <div class="row">
          <div class="field"><label for="p-tel">WhatsApp</label><input id="p-tel" name="tel" inputmode="tel" value="${esc(fmtPhone(p.tel))}" placeholder="(17) 99999-0000"></div>
          <div class="field"><label for="p-email">E-mail</label><input id="p-email" type="email" name="email" value="${esc(p.email)}"></div>
        </div>
        <div class="row">
          <div class="field"><label for="p-nasc">Nascimento</label><input id="p-nasc" type="date" name="nasc" value="${esc(p.nasc)}"></div>
          <div class="field"><label for="p-valor">Valor da sessão (R$)</label><input id="p-valor" type="number" name="valor" value="${esc(p.valor)}" min="0" step="0.01"></div>
        </div>
        <div class="field"><label for="p-contato">Contato de emergência ou responsável</label><input id="p-contato" name="contato" value="${esc(p.contato || '')}"></div>
        <div class="modal-foot">${p.id ? `<button type="button" class="btn btn-danger" data-action="delete-patient" data-id="${p.id}">Excluir</button>` : ''}<button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary" type="submit">Salvar</button></div>
      </form>`);
    $('#form-patient').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const data = { nome: f.nome.trim(), tel: digits(f.tel), email: f.email.trim(), nasc: f.nasc, valor: Number(f.valor) || 0, contato: f.contato.trim() };
      if (p.id) Object.assign(patient(p.id), data);
      else { const np = Object.assign({ id: uid(), anamnese: '', criado: todayIso() }, data); db.patients.push(np); p = np; }
      save();
      closeModal();
      location.hash = 'paciente/' + p.id;
      render();
      toast('Paciente salvo');
    });
  }

  function viewPatient(id) {
    const p = patient(id);
    if (!p) return '<div class="empty">Paciente não encontrado. <a href="#pacientes">Voltar</a></div>';
    const st = patientStats(id);
    const notes = db.notes.filter((n) => n.pid === id).sort((a, b) => b.date.localeCompare(a.date));
    const hist = st.list.slice().sort(sortSes).reverse();
    const age = p.nasc ? Math.floor((Date.now() - parse(p.nasc)) / 31557600000) : null;
    const tabs = { prontuario: 'Evoluções', anamnese: 'Anamnese', sessoes: 'Sessões' };
    let body = '';
    if (ui.tab === 'anamnese') {
      body = `<div class="field"><label for="anamnese">Anamnese e plano terapêutico</label><textarea id="anamnese" style="min-height:260px">${esc(p.anamnese)}</textarea></div><button class="btn btn-primary" data-action="save-anamnese" data-id="${id}">Salvar anamnese</button>`;
    } else if (ui.tab === 'sessoes') {
      body = hist.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th class="hide-sm">Horário</th><th>Status</th><th class="num">Valor</th><th>Pagamento</th></tr></thead><tbody>${hist.map((s) => `<tr><td><a href="#" data-action="open-session" data-id="${s.id}">${esc(fmtDate(s.date))}</a></td><td class="hide-sm">${esc(s.time)}</td><td><span class="tag ${s.status}">${STATUS[s.status]}</span></td><td class="num">${brl(s.valor)}</td><td>${s.status === 'realizada' || s.status === 'falta' ? `<span class="tag ${s.pago ? 'pago' : 'pendente'}">${s.pago ? 'Pago' : 'Em aberto'}</span>` : '-'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma sessão ainda.</div>';
    } else {
      body = `<form id="form-note" class="field"><label for="note-text">Nova evolução</label><textarea id="note-text" placeholder="O que foi trabalhado, observações clínicas, combinados para a próxima sessão"></textarea><div class="row" style="margin-top:8px;align-items:end"><div><label for="note-date">Data</label><input id="note-date" type="date" value="${todayIso()}"></div><div style="text-align:right"><button class="btn btn-primary" type="submit">Adicionar evolução</button></div></div></form>
        ${notes.length ? notes.map((n) => `<div class="note"><div class="note-head"><span>${esc(fmtDate(n.date))}</span><button class="btn btn-sm btn-danger" data-action="delete-note" data-id="${n.id}">Excluir</button></div><p>${esc(n.text)}</p></div>`).join('') : '<div class="empty">Nenhuma evolução registrada.</div>'}`;
    }
    return `
      <div class="page-head"><div><a href="#pacientes" class="muted small">← Pacientes</a><h1 style="margin-top:4px">${esc(p.nome)}</h1></div>
        <div class="actions"><button class="btn" data-action="print-record" data-id="${id}">Exportar prontuário</button><button class="btn btn-primary" data-action="new-session" data-pid="${id}" data-date="${todayIso()}">+ Agendar</button></div></div>
      <div class="detail">
        <div>
          <div class="card">
            <div class="card-head"><h2>Dados</h2><button class="btn btn-sm" data-action="edit-patient" data-id="${id}">Editar</button></div>
            <dl class="kv">
              <dt>WhatsApp</dt><dd>${esc(fmtPhone(p.tel)) || '-'}</dd>
              <dt>E-mail</dt><dd>${esc(p.email) || '-'}</dd>
              <dt>Idade</dt><dd>${age != null ? age + ' anos' : '-'}</dd>
              <dt>Valor</dt><dd>${brl(p.valor)}</dd>
              ${p.contato ? `<dt>Contato</dt><dd>${esc(p.contato)}</dd>` : ''}
              <dt>Desde</dt><dd>${p.criado ? esc(fmtDate(p.criado)) : '-'}</dd>
            </dl>
            ${p.tel ? `<a class="btn btn-wa btn-sm" href="${esc(waLink(p.tel, `Oi, ${firstName(p.nome)}!`))}" target="_blank" rel="noopener">Abrir conversa</a>` : ''}
          </div>
          <div class="card">
            <h2 style="margin-bottom:10px">Resumo</h2>
            <dl class="kv">
              <dt>Realizadas</dt><dd>${st.done.length}</dd>
              <dt>Faltas</dt><dd>${st.list.filter((s) => s.status === 'falta').length}</dd>
              <dt>Próxima</dt><dd>${st.next ? `${esc(fmtDate(st.next.date))} às ${esc(st.next.time)}` : '-'}</dd>
              <dt>Em aberto</dt><dd>${st.owed ? `<b style="color:var(--red)">${brl(st.owed)}</b>` : 'Nada'}</dd>
            </dl>
            ${st.owed ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-wa btn-sm" href="${esc(waLink(p.tel, chargeText(p, st.owed)))}" target="_blank" rel="noopener">Cobrar no WhatsApp</a><button class="btn btn-sm" data-action="pay-all" data-id="${id}">Receber tudo</button></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${ui.tab === k ? 'active' : ''}" data-action="tab" data-tab="${k}">${v}</button>`).join('')}</div>
          ${body}
          <p class="muted small" style="margin:16px 0 0">Registro documental conforme a Resolução CFP 001/2009: guarde por no mínimo 5 anos.</p>
        </div>
      </div>`;
  }

  function chargeText(p, total) {
    return db.settings.cobranca.replace(/\{paciente\}/g, firstName(p.nome)).replace(/\{valor\}/g, brl(total)).replace(/\{pix\}/g, db.settings.pix || '(cadastre sua chave Pix)');
  }

  /* ---------- financeiro ---------- */
  function viewFinance() {
    const m = ui.month;
    const [y, mo] = m.split('-').map(Number);
    const list = db.sessions.filter((s) => s.date.startsWith(m) && (s.status === 'realizada' || s.status === 'falta')).sort(sortSes).reverse();
    const recebido = list.filter((s) => s.pago).reduce((a, s) => a + Number(s.valor), 0);
    const aberto = list.filter((s) => !s.pago).reduce((a, s) => a + Number(s.valor), 0);
    const previsto = db.sessions.filter((s) => s.date.startsWith(m) && (s.status === 'agendada' || s.status === 'confirmada')).reduce((a, s) => a + Number(s.valor), 0);
    const owing = {};
    db.sessions.filter((s) => (s.status === 'realizada' || s.status === 'falta') && !s.pago).forEach((s) => { owing[s.pid] = (owing[s.pid] || 0) + Number(s.valor); });
    const owingList = Object.entries(owing).map(([pid, v]) => [patient(pid), v]).filter(([p]) => p).sort((a, b) => b[1] - a[1]);
    return `
      <div class="page-head"><div><h1>Financeiro</h1><p class="muted small" style="margin:4px 0 0">${MONTHS[mo - 1]} de ${y}</p></div>
        <div class="actions"><button class="btn icon-btn" data-action="month" data-dir="-1" aria-label="Mês anterior">‹</button><button class="btn" data-action="month" data-dir="0">Este mês</button><button class="btn icon-btn" data-action="month" data-dir="1" aria-label="Próximo mês">›</button></div></div>
      <div class="stats">
        <div class="stat"><small>Recebido</small><b style="color:var(--green)">${brl(recebido)}</b></div>
        <div class="stat"><small>Em aberto no mês</small><b style="color:var(--red)">${brl(aberto)}</b></div>
        <div class="stat"><small>Previsto (agendadas)</small><b>${brl(previsto)}</b></div>
        <div class="stat"><small>Sessões cobradas</small><b>${list.length}</b></div>
      </div>
      ${owingList.length ? `<div class="card"><div class="card-head"><h2>Pacientes com valores em aberto</h2><span class="muted small">Considera todos os meses</span></div>
        <div class="list">${owingList.map(([p, v]) => `<div class="item"><div class="avatar">${esc(initials(p.nome))}</div><div class="grow"><b>${esc(p.nome)}</b><span>${brl(v)} em aberto</span></div><a class="btn btn-wa btn-sm" href="${esc(waLink(p.tel, chargeText(p, v)))}" target="_blank" rel="noopener">Cobrar</a><button class="btn btn-sm" data-action="pay-all" data-id="${p.id}">Recebido</button></div>`).join('')}</div></div>` : ''}
      <div class="card">
        <div class="card-head"><h2>Sessões do mês</h2></div>
        ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Paciente</th><th class="hide-sm">Status</th><th class="num">Valor</th><th>Pagamento</th><th></th></tr></thead><tbody>
          ${list.map((s) => { const p = patient(s.pid); return `<tr><td>${esc(fmtDate(s.date).slice(0, 5))}</td><td>${esc(p ? p.nome : '-')}</td><td class="hide-sm"><span class="tag ${s.status}">${STATUS[s.status]}</span></td><td class="num">${brl(s.valor)}</td><td><button class="btn btn-sm" data-action="toggle-paid" data-id="${s.id}"><span class="tag ${s.pago ? 'pago' : 'pendente'}">${s.pago ? 'Pago' : 'Em aberto'}</span></button></td><td>${s.pago ? `<button class="btn btn-sm" data-action="receipt" data-id="${s.id}">Recibo</button>` : ''}</td></tr>`; }).join('')}
        </tbody></table></div>` : '<div class="empty">Nenhuma sessão realizada neste mês.</div>'}
      </div>`;
  }

  function extenso(v) {
    // valor por extenso simples para recibos (até 999.999)
    const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const c = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const tri = (n) => {
      if (n === 100) return 'cem';
      const parts = [];
      if (n >= 100) { parts.push(c[Math.floor(n / 100)]); n %= 100; }
      if (n >= 20) { parts.push(d[Math.floor(n / 10)]); n %= 10; if (n) parts.push(u[n]); } else if (n) parts.push(u[n]);
      return parts.join(' e ');
    };
    const reais = Math.floor(v);
    const cents = Math.round((v - reais) * 100);
    let txt = '';
    if (reais >= 1000) { const mil = Math.floor(reais / 1000); txt = (mil === 1 ? 'mil' : tri(mil) + ' mil'); const r = reais % 1000; if (r) txt += (r < 100 || r % 100 === 0 ? ' e ' : ' ') + tri(r); }
    else txt = tri(reais);
    txt = txt ? txt + (reais === 1 ? ' real' : ' reais') : '';
    if (cents) txt += (txt ? ' e ' : '') + tri(cents) + (cents === 1 ? ' centavo' : ' centavos');
    return txt || 'zero reais';
  }

  function receiptModal(id) {
    const s = session(id);
    const p = patient(s.pid) || { nome: '-' };
    const cfg = db.settings;
    const now = new Date();
    const html = `<div class="receipt">
      <h2>RECIBO</h2>
      <p style="text-align:right"><b>${brl(s.valor)}</b></p>
      <p>Recebi de <b>${esc(p.nome)}</b> a quantia de <b>${brl(s.valor)}</b> (${esc(extenso(Number(s.valor)))}), referente a sessão de psicoterapia realizada em ${esc(fmtDate(s.date))}.</p>
      <p>${esc(cfg.cidade || '')}${cfg.cidade ? ', ' : ''}${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}.</p>
      <div class="sign"><hr><b>${esc(cfg.nome)}</b><br>Psicóloga(o) · CRP ${esc(cfg.crp)}${cfg.cpf ? `<br>CPF ${esc(cfg.cpf)}` : ''}</div>
    </div>`;
    openModal(`<div class="modal-head"><h2>Recibo</h2><button class="close" data-action="close" aria-label="Fechar">×</button></div>${html}
      <div class="modal-foot"><button class="btn" data-action="close">Fechar</button><button class="btn btn-primary" data-action="print">Imprimir ou salvar PDF</button></div>`);
    $('#print-area').innerHTML = html;
  }

  function printRecord(id) {
    const p = patient(id);
    const notes = db.notes.filter((n) => n.pid === id).sort((a, b) => a.date.localeCompare(b.date));
    $('#print-area').innerHTML = `<div class="receipt" style="font-family:Inter,system-ui,sans-serif">
      <h2 style="font-family:inherit">Prontuário psicológico</h2>
      <p><b>Paciente:</b> ${esc(p.nome)}<br><b>Profissional:</b> ${esc(db.settings.nome)}, CRP ${esc(db.settings.crp)}<br><b>Emitido em:</b> ${esc(fmtDate(todayIso()))}</p>
      <h3>Anamnese</h3><p style="white-space:pre-wrap">${esc(p.anamnese || '-')}</p>
      <h3>Evoluções</h3>${notes.map((n) => `<p><b>${esc(fmtDate(n.date))}</b><br><span style="white-space:pre-wrap">${esc(n.text)}</span></p>`).join('') || '<p>-</p>'}
      <p class="small muted">Documento sigiloso. Resolução CFP 001/2009.</p></div>`;
    doPrint();
  }

  function doPrint() {
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => document.body.classList.remove('printing'), 500);
  }

  /* ---------- configurações ---------- */
  function viewConfig() {
    const c = db.settings;
    return `
      <div class="page-head"><h1>Configurações</h1></div>
      <form id="form-config">
        <div class="card">
          <h2 style="margin-bottom:14px">Seus dados</h2>
          <div class="row"><div class="field"><label for="c-nome">Nome profissional</label><input id="c-nome" name="nome" value="${esc(c.nome)}"></div><div class="field"><label for="c-crp">CRP</label><input id="c-crp" name="crp" value="${esc(c.crp)}"></div></div>
          <div class="row"><div class="field"><label for="c-cpf">CPF (aparece no recibo)</label><input id="c-cpf" name="cpf" value="${esc(c.cpf)}"></div><div class="field"><label for="c-cidade">Cidade</label><input id="c-cidade" name="cidade" value="${esc(c.cidade)}"></div></div>
          <div class="row"><div class="field"><label for="c-valor">Valor padrão da sessão (R$)</label><input id="c-valor" type="number" name="valor" value="${esc(c.valor)}" min="0" step="0.01"></div><div class="field"><label for="c-pix">Chave Pix</label><input id="c-pix" name="pix" value="${esc(c.pix)}"></div></div>
        </div>
        <div class="card">
          <h2 style="margin-bottom:4px">Mensagens do WhatsApp</h2>
          <p class="muted small">Use {paciente}, {dia}, {hora} e {link} no lembrete, e {paciente}, {valor} e {pix} na cobrança.</p>
          <div class="field"><label for="c-lembrete">Lembrete de sessão</label><textarea id="c-lembrete" name="lembrete">${esc(c.lembrete)}</textarea></div>
          <div class="field"><label for="c-cobranca">Cobrança</label><textarea id="c-cobranca" name="cobranca">${esc(c.cobranca)}</textarea></div>
          <button class="btn btn-primary" type="submit">Salvar configurações</button>
        </div>
      </form>
      <div class="card">
        <h2 style="margin-bottom:8px">Seus dados</h2>
        <p class="muted small">Baixe uma cópia completa de pacientes, sessões e prontuários.</p>
        <button class="btn" data-action="export">Baixar backup (JSON)</button>
      </div>`;
  }

  /* ---------- modal ---------- */
  function openModal(html) {
    $('#modal-root').innerHTML = `<div class="modal-bg" data-action="bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    const f = $('#modal-root input, #modal-root select, #modal-root textarea');
    if (f && window.matchMedia('(min-width: 761px)').matches) f.focus();
  }
  function closeModal() { $('#modal-root').innerHTML = ''; }

  /* ---------- eventos ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    const id = el.dataset.id;
    switch (a) {
      case 'bg': if (e.target === el) closeModal(); return;
      case 'close': closeModal(); return;
      case 'close-link': closeModal(); return;
      case 'reset':
        db = seed(); save(); ui.weekStart = startOfWeek(new Date()); ui.month = todayIso().slice(0, 7); render(); toast('Dados de exemplo restaurados'); return;
      case 'week':
        ui.weekStart = el.dataset.dir === '0' ? startOfWeek(new Date()) : addDays(ui.weekStart, 7 * Number(el.dataset.dir)); render(); return;
      case 'month': {
        if (el.dataset.dir === '0') ui.month = todayIso().slice(0, 7);
        else { const [y, m] = ui.month.split('-').map(Number); const d = new Date(y, m - 1 + Number(el.dataset.dir), 1); ui.month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
        render(); return;
      }
      case 'new-session': newSessionModal(el.dataset.date || todayIso(), el.dataset.pid); return;
      case 'open-session': e.preventDefault(); sessionModal(id); return;
      case 'set-status': {
        const s = session(id); s.status = el.dataset.status; save();
        render(); if (el.dataset.keep) sessionModal(id);
        toast(`Status: ${STATUS[s.status]}`); return;
      }
      case 'toggle-paid': {
        const s = session(id); s.pago = !s.pago; save(); render();
        if (el.dataset.keep) sessionModal(id);
        toast(s.pago ? 'Pagamento registrado' : 'Marcado como em aberto'); return;
      }
      case 'save-session-note': {
        const s = session(id);
        const text = $('#ses-note').value.trim();
        const n = db.notes.find((x) => x.sid === id);
        if (text && n) n.text = text;
        else if (text) db.notes.push({ id: uid(), pid: s.pid, sid: id, date: s.date, text });
        else if (n) db.notes = db.notes.filter((x) => x !== n);
        save(); closeModal(); render(); toast('Salvo'); return;
      }
      case 'delete-session':
        if (!confirmInline(el)) return;
        db.sessions = db.sessions.filter((s) => s.id !== id); db.notes = db.notes.filter((n) => n.sid !== id);
        save(); closeModal(); render(); toast('Sessão excluída'); return;
      case 'new-patient': patientForm(); return;
      case 'edit-patient': patientForm(patient(id)); return;
      case 'delete-patient':
        if (!confirmInline(el)) return;
        db.patients = db.patients.filter((p) => p.id !== id); db.sessions = db.sessions.filter((s) => s.pid !== id); db.notes = db.notes.filter((n) => n.pid !== id);
        save(); closeModal(); location.hash = 'pacientes'; toast('Paciente excluído'); return;
      case 'tab': ui.tab = el.dataset.tab; render(); return;
      case 'save-anamnese': patient(id).anamnese = $('#anamnese').value; save(); toast('Anamnese salva'); return;
      case 'delete-note':
        if (!confirmInline(el)) return;
        db.notes = db.notes.filter((n) => n.id !== id); save(); render(); toast('Evolução excluída'); return;
      case 'pay-all':
        db.sessions.forEach((s) => { if (s.pid === id && (s.status === 'realizada' || s.status === 'falta')) s.pago = true; }); save(); render(); toast('Pagamentos registrados'); return;
      case 'receipt': receiptModal(id); return;
      case 'print': doPrint(); return;
      case 'print-record': printRecord(id); return;
      case 'export': {
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `backup-consultorio-${todayIso()}.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
    }
  });

  // Confirmação em dois toques, sem janela do navegador
  function confirmInline(el) {
    if (el.dataset.armed) return true;
    el.dataset.armed = '1';
    const old = el.textContent;
    el.textContent = 'Toque de novo para confirmar';
    setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = old; } }, 3000);
    return false;
  }

  document.addEventListener('input', (e) => {
    if (e.target.id === 'search') {
      ui.search = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const s = $('#search'); s.focus(); s.setSelectionRange(pos, pos);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'form-config') {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      Object.assign(db.settings, f, { valor: Number(f.valor) || 0 });
      save(); toast('Configurações salvas');
    } else if (e.target.id === 'form-note') {
      e.preventDefault();
      const text = $('#note-text').value.trim();
      if (!text) { toast('Escreva a evolução antes de salvar'); return; }
      db.notes.push({ id: uid(), pid: route().arg, sid: null, date: $('#note-date').value || todayIso(), text });
      save(); render(); toast('Evolução adicionada');
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  window.addEventListener('hashchange', () => { if (route().page !== 'paciente') ui.tab = 'prontuario'; render(); });

  load();
  render();
})();
