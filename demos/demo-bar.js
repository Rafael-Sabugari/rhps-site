// Monta a faixa "Projeto de demonstração" no rodapé das demos.
// Com ?limpo na URL a faixa some (usado para gravar os vídeos).
(function () {
  if (new URLSearchParams(location.search).has('limpo')) return;
  const kind = document.currentScript.dataset.kind || 'um projeto como este';
  const msg = encodeURIComponent(`Olá! Vi a demonstração no site e quero ${kind}.`);
  const bar = document.createElement('div');
  bar.className = 'rhps-bar';
  bar.innerHTML = `
    <a class="rhps-bar-brand" href="../../#portfolio">
      <img src="../../assets/logo.svg" alt="">
      <span>Demonstração <b>RHPS Systems</b> <small>· ver outros projetos</small></span>
    </a>
    <a class="rhps-bar-cta" href="https://wa.me/5517992440805?text=${msg}" target="_blank" rel="noopener">Quero um assim</a>`;
  document.body.appendChild(bar);
})();
