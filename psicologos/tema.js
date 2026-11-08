/* Tema claro/escuro do site do Psimeta.
   Carregado no <head> para aplicar o tema antes de a página aparecer (sem piscar).
   Sem escolha salva, segue o modo do celular ou computador. */
(function () {
  var CHAVE = 'psimeta-site-tema';
  var m = window.matchMedia('(prefers-color-scheme: dark)');
  function salvo() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function atual() { var s = salvo(); return s === 'claro' || s === 'escuro' ? s : (m.matches ? 'escuro' : 'claro'); }
  function aplicar() {
    var t = atual();
    document.documentElement.setAttribute('data-tema', t);
    var c = document.querySelector('meta[name="theme-color"]');
    if (c) c.setAttribute('content', t === 'escuro' ? '#0e1120' : '#f6f7fb');
    var b = document.querySelectorAll('.tema-btn');
    for (var i = 0; i < b.length; i++) {
      b[i].setAttribute('aria-label', t === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro');
      b[i].setAttribute('title', t === 'escuro' ? 'Tema claro' : 'Tema escuro');
    }
  }
  aplicar();
  if (m.addEventListener) m.addEventListener('change', aplicar);
  document.addEventListener('DOMContentLoaded', aplicar);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.tema-btn');
    if (!b) return;
    try { localStorage.setItem(CHAVE, atual() === 'escuro' ? 'claro' : 'escuro'); } catch (x) {}
    aplicar();
  });
})();
