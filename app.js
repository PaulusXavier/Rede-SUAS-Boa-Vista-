// ---------- Color mapping (leaflet awesome-marker color names -> hex) ----------
const COLORHEX = {
  red:'#D9483F', blue:'#3388CC', green:'#2F7A5C', purple:'#8E44AD', orange:'#F2994A',
  darkred:'#8B2E2A', darkblue:'#123C5C', cadetblue:'#4E7A81'
};
const CREAS_COLORS = { blue:'#C0524F', darkblue:'#9C3F3C', green:'#3C8A5B' };

function hexFor(kind, color){
  if(kind === 'creas') return CREAS_COLORS[color] || '#C0524F';
  return COLORHEX[color] || '#2F7A5C';
}

// ---------- Build flat list of all units with kind ----------
const ALL_UNITS = [
  ...UNITS.cras.map(u => ({...u, kind:'cras'})),
  ...UNITS.creas.map(u => ({...u, kind:'creas'}))
];

// ---------- Map setup ----------
let map, crasLayer, creasLayer, userMarker;
function initMap(){
  map = L.map('map', { zoomControl:false, doubleClickZoom:false }).setView([2.81, -60.705], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; OpenStreetMap'
  }).addTo(map);
  L.control.zoom({position:'bottomleft'}).addTo(map);

  crasLayer = L.layerGroup();
  creasLayer = L.layerGroup();

  UNITS.cras.forEach(u => addMarker(u, 'cras', crasLayer));
  UNITS.creas.forEach(u => addMarker(u, 'creas', creasLayer));

  crasLayer.addTo(map);
  creasLayer.addTo(map);
}

function iconFor(kind, color){
  const hex = hexFor(kind, color);
  const symbol = kind === 'cras'
    ? '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>'
    : '<path d="M12 21s-7-4.35-9.5-9C1 8 2.5 4.5 6 4.2c2-.2 4 .8 6 3 2-2.2 4-3.2 6-3 3.5.3 5 3.8 3.5 7.8C19 16.65 12 21 12 21z"/>';
  return L.divIcon({
    className:'',
    html:`<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${hex};transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;border:2px solid white;">
            <svg style="transform:rotate(45deg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${symbol}</svg>
          </div>`,
    iconSize:[34,34],
    iconAnchor:[17,34],
    popupAnchor:[0,-32]
  });
}

function addMarker(u, kind, layer){
  const marker = L.marker([u.lat, u.lng], { icon: iconFor(kind, u.color) });
  const telHtml = u.phone && u.phone !== 'N/A'
    ? `<div class="poptel">📞 <a href="tel:${u.phone.replace(/[^\d+]/g,'')}" style="color:inherit">${u.phone}</a></div>`
    : `<div class="poptel" style="opacity:.6">📞 Não informado</div>`;

  const bairros = kind === 'cras' ? u.bairros_list : u.area_list;
  let areaHtml = '';
  if(bairros && bairros.length){
    const tags = bairros.map(b => `<span class="poptag">${b}</span>`).join('');
    areaHtml = `<div class="popareatitle">🏘️ Bairros atendidos</div><div class="popareas">${tags}</div>`;
  } else if(u.desc){
    areaHtml = `<div class="popareatitle">ℹ️ Atendimento</div><div class="popdesc">${u.desc}</div>`;
  }

  marker.bindPopup(
    `<div class="popname">${u.name}</div>
     <div class="popaddr">📍 ${u.address}</div>
     ${telHtml}
     ${areaHtml}`,
    { maxWidth: 260, maxHeight: 260 }
  );
  marker._unitRef = u;
  marker._kind = kind;
  layer.addLayer(marker);
  u._marker = marker;
}

// ---------- Layer toggle chips ----------
document.getElementById('chipCras').addEventListener('click', function(){
  toggleLayer(this, crasLayer);
});
document.getElementById('chipCreas').addEventListener('click', function(){
  toggleLayer(this, creasLayer);
});
function toggleLayer(chip, layer){
  if(map.hasLayer(layer)){ map.removeLayer(layer); chip.classList.remove('on'); }
  else { layer.addTo(map); chip.classList.add('on'); }
}

// ---------- Geolocation ----------
document.getElementById('locBtn').addEventListener('click', () => {
  if(!navigator.geolocation){ return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    if(userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([latitude, longitude], {
      radius:9, color:'#fff', weight:3, fillColor:'#4A90D9', fillOpacity:1
    }).addTo(map);
    map.setView([latitude, longitude], 15);
  }, () => {
    alert('Não foi possível obter sua localização. Verifique as permissões do app.');
  });
});

// ---------- List view ----------
function renderList(){
  const el = document.getElementById('view-list');
  let html = '';

  html += `<div class="sectiontitle"><span>CRAS &mdash; Proteção Básica</span><span class="line"></span></div>`;
  UNITS.cras.forEach((u,i) => { html += unitCard(u, 'cras', i); });

  html += `<div class="sectiontitle"><span>CREAS &mdash; Proteção Especial</span><span class="line"></span></div>`;
  UNITS.creas.forEach((u,i) => { html += unitCard(u, 'creas', i); });

  el.innerHTML = html;
}

function unitCard(u, kind, idx){
  const hex = hexFor(kind, u.color);
  const label = kind === 'cras' ? 'CRAS' : 'CREAS';
  const bairros = kind === 'cras' ? u.bairros_list : u.area_list;
  const telClean = u.phone && u.phone !== 'N/A' ? u.phone.replace(/[^\d+]/g,'') : null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${u.lat},${u.lng}`;
  const bairrosHtml = bairros && bairros.length
    ? bairros.map(b => `<span class="bairro-tag">${b}</span>`).join('')
    : (u.desc ? u.desc : '');

  return `
  <div class="card">
    <div class="stripe" style="background:${hex}"></div>
    <div class="ctop">
      <h3>${u.name}</h3>
      <span class="kind ${kind}">${label}</span>
    </div>
    <div class="row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span>${u.address}</span>
    </div>
    <div class="row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.68 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0122 16.92z"/></svg>
      ${telClean ? `<a href="tel:${telClean}">${u.phone}</a>` : '<span style="opacity:.6">Não informado</span>'}
    </div>
    ${bairros && bairros.length ? `
    <div class="toggle-bairros" onclick="toggleBairros(this)">
      <span>Bairros atendidos (${bairros.length})</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="bairros-list">${bairrosHtml}</div>` : (u.desc ? `<div class="row" style="margin-top:10px"><span>${u.desc}</span></div>` : '')}
    <div class="actions">
      <a class="actionbtn primary" href="tel:${telClean || ''}" ${!telClean ? 'style="opacity:.5;pointer-events:none;"' : ''}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.68 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0122 16.92z"/></svg>
        Ligar
      </a>
      <a class="actionbtn" href="${mapsUrl}" target="_blank" rel="noopener">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Rota
      </a>
      <a class="actionbtn" href="#" onclick="showOnMap('${kind}', ${idx}); return false;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/></svg>
        Mapa
      </a>
    </div>
  </div>`;
}

function toggleBairros(el){
  el.nextElementSibling.classList.toggle('show');
  const arrow = el.querySelector('svg');
  arrow.style.transform = el.nextElementSibling.classList.contains('show') ? 'rotate(180deg)' : '';
}

function showOnMap(kind, idx){
  const u = kind === 'cras' ? UNITS.cras[idx] : UNITS.creas[idx];
  switchView('map');
  if(!map){
    console.error('Mapa não disponível.');
    return;
  }
  map.setView([u.lat, u.lng], 16, { animate:true });
  setTimeout(() => { if(u._marker) u._marker.openPopup(); }, 350);
}

// ---------- Tabs ----------
function switchView(name){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('nav.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  if(name === 'map' && map){ setTimeout(() => map.invalidateSize(), 80); }
  closeSuggest();
}
document.querySelectorAll('nav.tabbar button').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ---------- Search ----------
const searchInput = document.getElementById('searchInput');
const suggestBox = document.getElementById('suggestBox');
const clearBtn = document.getElementById('clearBtn');

function buildSearchIndex(){
  const idx = [];
  ALL_UNITS.forEach(u => {
    idx.push({ type:'unit', kind:u.kind, name:u.name, sub:u.address, unit:u });
    const bairros = u.kind === 'cras' ? u.bairros_list : u.area_list;
    if(bairros) bairros.forEach(b => idx.push({ type:'bairro', kind:u.kind, name:b, sub:`Atendido por ${u.name}`, unit:u }));
  });
  return idx;
}
const SEARCH_INDEX = buildSearchIndex();

function normalize(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  clearBtn.style.display = q ? 'flex' : 'none';
  if(!q){ closeSuggest(); return; }
  const nq = normalize(q);
  const results = SEARCH_INDEX.filter(r => normalize(r.name).includes(nq)).slice(0, 8);
  renderSuggest(results, q);
});
searchInput.addEventListener('focus', () => {
  if(searchInput.value.trim()) suggestBox.classList.add('show');
});
clearBtn.addEventListener('click', () => {
  searchInput.value = ''; clearBtn.style.display = 'none'; closeSuggest(); searchInput.focus();
});
document.addEventListener('click', (e) => {
  if(!e.target.closest('.searchwrap')) closeSuggest();
});
function closeSuggest(){ suggestBox.classList.remove('show'); }

function renderSuggest(results, q){
  if(!results.length){
    suggestBox.innerHTML = `<div style="padding:16px; font-size:13px; color:var(--ink-soft);">Nada encontrado para "${q}"</div>`;
    suggestBox.classList.add('show');
    return;
  }
  suggestBox.innerHTML = results.map(r => {
    const hex = hexFor(r.kind, r.unit.color);
    const tag = r.type === 'bairro' ? '🏘️' : (r.kind === 'cras' ? '🏠' : '🛡️');
    return `<div class="sitem" data-name="${r.unit.name}" data-kind="${r.kind}">
      <span class="dotc" style="background:${hex}"></span>
      <div class="stext"><b>${tag} ${r.name}</b><span>${r.sub}</span></div>
    </div>`;
  }).join('');
  suggestBox.classList.add('show');
  suggestBox.querySelectorAll('.sitem').forEach((el, i) => {
    el.addEventListener('click', () => {
      const r = results[i];
      searchInput.value = r.name;
      closeSuggest();
      const list = r.kind === 'cras' ? UNITS.cras : UNITS.creas;
      const idx = list.findIndex(x => x.name === r.unit.name);
      showOnMap(r.kind, idx);
    });
  });
}

// ---------- Init ----------
try {
  initMap();
} catch(err) {
  console.error('Falha ao iniciar o mapa:', err);
}
renderList();

// ---------- Service worker (for installability / offline shell) ----------
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
