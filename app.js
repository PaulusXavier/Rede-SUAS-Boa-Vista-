/**
 * SISTEMA DE MAPA DE GEOLOCALIZAÇÃO - REDE SUAS BOA VISTA
 * Arquivo: app.js
 */

// ---------- Variáveis Globais ----------
let map;
let markersGroup;
let userLocationMarker = null;
let SEARCH_INDEX = [];
let ALL_UNITS = [];
let activeFilters = { cras: true, creas: true };

// ---------- 1. Inicialização do Mapa ----------
function initMap() {
  // Coordenadas centrais de Boa Vista - RR
  const defaultCenter = [2.8197, -60.6732]; 
  const defaultZoom = 13;

  // Criação do mapa Leaflet sincronizado com a div #map do HTML
  map = L.map('map', {
    zoomControl: false // Desabilitado por padrão para controle manual se preferido
  }).setView(defaultCenter, defaultZoom);

  // Adicionando camada de mapa (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Adiciona o controle de zoom no canto superior direito para não atrapalhar os botões
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Cria o grupo de marcadores para gerenciar pins na tela com facilidade
  markersGroup = L.layerGroup().addTo(map);

  // Atualiza os marcadores no mapa e gera a lista lateral de unidades
  updateMapAndList();
}

// ---------- 2. Normalização de Texto (Garante busca sem falhas por acentos) ----------
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD') // Divide caracteres especiais (ex: "ã" vira "a" + "~")
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos e rabiscos
    .trim();
}

// ---------- 3. Construção do Índice de Busca Inteligente ----------
function buildSearchIndex() {
  const index = [];

  if (typeof UNITS === 'undefined') {
    console.error("ERRO: O arquivo 'data.js' não foi carregado ou a variável 'UNITS' está ausente.");
    return [];
  }

  // Mapeamento das Unidades de CRAS
  if (UNITS.cras) {
    UNITS.cras.forEach(unit => {
      // Indexa o próprio nome do CRAS e o endereço
      index.push({ text: normalizarTexto(unit.name), unit: unit, type: 'cras', matchType: 'Unidade' });
      index.push({ text: normalizarTexto(unit.address), unit: unit, type: 'cras', matchType: 'Endereço' });

      // Indexa individualmente cada bairro atendido por esta unidade
      if (Array.isArray(unit.bairros_list)) {
        unit.bairros_list.forEach(bairro => {
          index.push({
            text: normalizarTexto(bairro),
            unit: unit,
            type: 'cras',
            matchType: 'Bairro',
            originalName: bairro
          });
        });
      }
    });
  }

  // Mapeamento das Unidades de CREAS (e outros itens inclusos nesta lista)
  if (UNITS.creas) {
    UNITS.creas.forEach(unit => {
      index.push({ text: normalizarTexto(unit.name), unit: unit, type: 'creas', matchType: 'Unidade' });
      index.push({ text: normalizarTexto(unit.address), unit: unit, type: 'creas', matchType: 'Endereço' });

      if (Array.isArray(unit.area_list)) {
        unit.area_list.forEach(bairro => {
          index.push({
            text: normalizarTexto(bairro),
            unit: unit,
            type: 'creas',
            matchType: 'Bairro',
            originalName: bairro
          });
        });
      }
    });
  }

  return index;
}

// ---------- 4. Mecanismo de Busca e Sugestões ----------
function realizarBusca(termoDigitado) {
  const suggestBox = document.getElementById('suggestBox');
  const clearBtn = document.getElementById('clearBtn');
  
  if (!suggestBox) return;

  const termoLimpo = normalizarTexto(termoDigitado);

  // Exibe ou esconde o botão de limpar campo (✕)
  if (clearBtn) {
    clearBtn.style.display = termoDigitado.length > 0 ? 'flex' : 'none';
  }

  // Se o usuário digitou menos que 2 letras, oculta a caixinha
  if (termoLimpo.length < 2) {
    suggestBox.classList.remove('show');
    suggestBox.innerHTML = '';
    return;
  }

  // Procura correspondência no índice de busca
  const correspondencias = SEARCH_INDEX.filter(item => item.text.includes(termoLimpo));

  // Remove repetições visuais da mesma unidade física
  const resultadosUnicos = [];
  const cacheIds = new Set();

  correspondencias.forEach(item => {
    // Cria uma chave única baseada no nome e no contexto encontrado para evitar redundância
    const chaveUnica = `${item.unit.name}-${item.matchType === 'Unidade' ? 'unidade' : item.originalName || ''}`;
    if (!cacheIds.has(chaveUnica)) {
      cacheIds.add(chaveUnica);
      resultadosUnicos.push({
        unit: item.unit,
        type: item.type,
        matchType: item.matchType,
        matchedText: item.matchType === 'Bairro' ? item.originalName : item.unit.name
      });
    }
  });

  // Renderiza até as 6 melhores sugestões para não travar a rolagem
  renderSugestoes(resultadosUnicos.slice(0, 6));
}

// ---------- 5. Renderizando as Sugestões Dinâmicas ----------
function renderSugestoes(lista) {
  const suggestBox = document.getElementById('suggestBox');
  if (!suggestBox) return;

  if (lista.length === 0) {
    suggestBox.innerHTML = '<div style="padding:14px; text-align:center; font-size:13.5px; color:var(--ink-soft);">Nenhum resultado encontrado</div>';
    suggestBox.classList.add('show');
    return;
  }

  suggestBox.innerHTML = '';

  // Agrupa cabeçalhos visuais se desejar, ou renderiza como itens diretos
  lista.forEach(item => {
    const sitem = document.createElement('div');
    sitem.className = 'sitem';

    // Determina a cor da bolinha indicadora da sugestão
    const corIndicador = item.unit.color === 'blue' ? 'var(--deep-blue)' : item.unit.color;

    sitem.innerHTML = `
      <div class="dotc" style="background-color: ${corIndicador || 'var(--jungle)'}"></div>
      <div class="stext">
        <b>${item.matchedText}</b>
        <span>${item.unit.name} • ${item.matchType}</span>
      </div>
    `;

    // Ação ao clicar na sugestão da lista
    sitem.addEventListener('click', () => {
      // Garante que o app mude para a aba do mapa se estiver em outra
      trocarAba('map');
      
      // Centraliza e expande as informações
      focarUnidade(item.unit);
      
      document.getElementById('searchInput').value = item.matchedText;
      suggestBox.classList.remove('show');
    });

    suggestBox.appendChild(sitem);
  });

  suggestBox.classList.add('show');
}

// ---------- 6. Focar e Abrir Popup no Mapa ----------
function focarUnidade(unit) {
  if (!map) return;

  // Fecha popups ativos antes de abrir o novo
  map.closePopup();

  // Voa elegantemente até o local desejado
  map.flyTo([unit.lat, unit.lng], 16, {
    animate: true,
    duration: 1.2
  });

  // Dispara o Popup do marcador correspondente logo após o final do voo
  setTimeout(() => {
    markersGroup.eachLayer(marker => {
      const latLng = marker.getLatLng();
      if (latLng.lat === unit.lat && latLng.lng === unit.lng) {
        marker.openPopup();
      }
    });
  }, 1300);
}

// ---------- 7. Renderizar Pins e Listagem Lateral de Unidades ----------
function updateMapAndList() {
  if (!markersGroup) return;
  markersGroup.clearLayers();

  const containerLista = document.getElementById('view-list');
  if (containerLista) containerLista.innerHTML = '';

  const unidadesParaMostrar = [];

  if (activeFilters.cras && UNITS.cras) {
    UNITS.cras.forEach(u => unidadesParaMostrar.push({ ...u, kind: 'cras' }));
  }
  if (activeFilters.creas && UNITS.creas) {
    UNITS.creas.forEach(u => unidadesParaMostrar.push({ ...u, kind: 'creas' }));
  }

  // 1. Geração de Marcadores (Pins) no Mapa
  unidadesParaMostrar.forEach(unit => {
    // Determina a cor visual baseada no serviço
    const mapPinColor = unit.kind === 'cras' ? 'var(--jungle)' : 'var(--creas-red)';

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin" style="background-color: ${mapPinColor}; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 5px rgba(0,0,0,0.4)"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });

    // Cria as tags estruturadas de abrangência do popup
    let listagemDeBairrosHTML = '';
    if (unit.kind === 'cras' && Array.isArray(unit.bairros_list)) {
      listagemDeBairrosHTML = unit.bairros_list.map(b => `<span class="poptag">${b}</span>`).join('');
    } else if (unit.kind === 'creas' && Array.isArray(unit.area_list)) {
      listagemDeBairrosHTML = unit.area_list.map(b => `<span class="poptag">${b}</span>`).join('');
    }

    const popupContent = `
      <div class="map-popup">
        <div class="popname">${unit.name}</div>
        <div class="popaddr">${unit.address}</div>
        <div class="poptel">📞 ${unit.phone || 'Não disponível'}</div>
        ${listagemDeBairrosHTML ? `
          <div class="popareatitle">Área de Cobertura</div>
          <div class="popareas">${listagemDeBairrosHTML}</div>
        ` : ''}
        ${unit.desc ? `<div class="popdesc"><i>${unit.desc}</i></div>` : ''}
      </div>
    `;

    L.marker([unit.lat, unit.lng], { icon: customIcon })
      .bindPopup(popupContent)
      .addTo(markersGroup);

    // 2. Geração dos Cards Dinâmicos na aba "Unidades"
    if (containerLista) {
      const card = document.createElement('div');
      card.className = 'card';
      const stripeColor = unit.kind === 'cras' ? 'var(--jungle)' : 'var(--creas-red)';

      let bairrosGridHTML = '';
      if (unit.kind === 'cras' && Array.isArray(unit.bairros_list)) {
        bairrosGridHTML = unit.bairros_list.map(b => `<span class="bairro-tag">${b}</span>`).join('');
      } else if (unit.kind === 'creas' && Array.isArray(unit.area_list)) {
        bairrosGridHTML = unit.area_list.map(b => `<span class="bairro-tag">${b}</span>`).join('');
      }

      card.innerHTML = `
        <div class="stripe" style="background-color: ${stripeColor}"></div>
        <div class="ctop">
          <h3>${unit.name}</h3>
          <span class="kind ${unit.kind}">${unit.kind.toUpperCase()}</span>
        </div>
        <div class="row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${unit.address}</span>
        </div>
        <div class="row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>${unit.phone ? `<a href="tel:${unit.phone.replace(/[^0-9]/g, '')}">${unit.phone}</a>` : 'Não disponível'}</span>
        </div>
        
        ${bairrosGridHTML ? `
          <div class="toggle-bairros" onclick="alternarVisibilidadeBairros(this)">
            Ver bairros atendidos ▼
          </div>
          <div class="bairros-list">
            ${bairrosGridHTML}
          </div>
        ` : ''}

        <div class="actions">
          <button class="actionbtn primary" onclick="verNoMapa(${unit.lat}, ${unit.lng})">Ver no mapa</button>
          <a class="actionbtn" href="https://www.google.com/maps/dir/?api=1&destination=${unit.lat},${unit.lng}" target="_blank" rel="noopener">Como chegar</a>
        </div>
      `;

      containerLista.appendChild(card);
    }
  });
}

// ---------- 8. Alternar Sanfona de Bairros nos Cards ----------
window.alternarVisibilidadeBairros = function(elementoClicado) {
  const bairrosListDiv = elementoClicado.nextElementSibling;
  if (bairrosListDiv && bairrosListDiv.classList.contains('bairros-list')) {
    const estaVisivel = bairrosListDiv.classList.toggle('show');
    elementoClicado.textContent = estaVisivel ? "Ocultar bairros atendidos ▲" : "Ver bairros atendidos ▼";
  }
};

// ---------- 9. Ver No Mapa (Ação do Card) ----------
window.verNoMapa = function(lat, lng) {
  trocarAba('map');
  const unit = findUnitByCoords(lat, lng);
  if (unit) {
    focarUnidade(unit);
  } else {
    map.flyTo([lat, lng], 16);
  }
};

function findUnitByCoords(lat, lng) {
  let found = UNITS.cras.find(u => u.lat === lat && u.lng === lng);
  if (!found) {
    found = UNITS.creas.find(u => u.lat === lat && u.lng === lng);
  }
  return found;
}

// ---------- 10. Trocar de Abas (Sistema de Menu Inferior) ----------
function trocarAba(viewId) {
  // Atualiza botões no menu inferior (tabbar)
  document.querySelectorAll('nav.tabbar button').forEach(btn => {
    if (btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Exibe a seção de visualização correspondente
  document.querySelectorAll('main .view').forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Atualiza mapa caso volte à tela dele para recalcular tamanho
  if (viewId === 'map' && map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}

// ---------- 11. Geolocalização Real do Usuário ----------
function obterGeolocalizacao() {
  if (!navigator.geolocation) {
    alert("Geolocalização não é suportada por seu navegador.");
    return;
  }

  const locBtn = document.getElementById('locBtn');
  if (locBtn) locBtn.style.color = '#F2994A'; // Muda ícone para laranja durante busca

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (locBtn) locBtn.style.color = 'var(--deep-blue)';

      // Centraliza no ponto do usuário
      map.setView([lat, lng], 15);

      // Cria ou move o marcador azul do usuário
      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-marker',
          html: '<div style="background-color:#1E90FF; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow: 0 0 10px rgba(30,144,255,0.8)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        userLocationMarker = L.marker([lat, lng], { icon: userIcon })
          .bindPopup("<b>Sua localização aproximada</b>")
          .addTo(map);
      }
    },
    (error) => {
      if (locBtn) locBtn.style.color = 'var(--deep-blue)';
      console.warn("Erro ao obter localização: ", error.message);
      alert("Não foi possível acessar sua localização atual. Verifique suas permissões de GPS.");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ---------- 12. Listeners e Eventos Gerais ----------
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const suggestBox = document.getElementById('suggestBox');
  const clearBtn = document.getElementById('clearBtn');
  const chipCras = document.getElementById('chipCras');
  const chipCreas = document.getElementById('chipCreas');
  const locBtn = document.getElementById('locBtn');

  // Input de busca
  if (searchInput) {
    searchInput.addEventListener('input', (e) => realizarBusca(e.target.value));
    
    // Mostra sugestões se já houver algo válido digitado quando focar
    searchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim().length >= 2) {
        suggestBox.classList.add('show');
      }
    });
  }

  // Botão Limpar Busca (✕)
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      suggestBox.classList.remove('show');
      suggestBox.innerHTML = '';
    });
  }

  // Ocultar sugestões clicando fora
  document.addEventListener('click', (e) => {
    if (suggestBox && searchInput && !searchInput.contains(e.target) && !suggestBox.contains(e.target)) {
      suggestBox.classList.remove('show');
    }
  });

  // Filtros (Chips do Mapa)
  if (chipCras) {
    chipCras.addEventListener('click', () => {
      activeFilters.cras = !activeFilters.cras;
      chipCras.classList.toggle('on', activeFilters.cras);
      updateMapAndList();
    });
  }

  if (chipCreas) {
    chipCreas.addEventListener('click', () => {
      activeFilters.creas = !activeFilters.creas;
      chipCreas.classList.toggle('on', activeFilters.creas);
      updateMapAndList();
    });
  }

  // Botão Geolocalização
  if (locBtn) {
    locBtn.addEventListener('click', obterGeolocalizacao);
  }

  // Cliques na Tabbar inferior para trocar visualizações
  document.querySelectorAll('nav.tabbar button').forEach(button => {
    button.addEventListener('click', () => {
      const targetView = button.getAttribute('data-view');
      trocarAba(targetView);
    });
  });
}

// ---------- 13. Inicialização DOMContentLoaded ----------
window.addEventListener('DOMContentLoaded', () => {
  // Prepara índices de busca
  if (typeof UNITS !== 'undefined') {
    SEARCH_INDEX = buildSearchIndex();
    ALL_UNITS = [
      ...UNITS.cras.map(u => ({ ...u, kind: 'cras' })),
      ...UNITS.creas.map(u => ({ ...u, kind: 'creas' }))
    ];
  } else {
    console.error("Variável UNITS não declarada. Verifique se data.js está carregando corretamente antes do app.js.");
  }

  // Inicia Mapa
  try {
    initMap();
  } catch (err) {
    console.error("Falha ao criar instância do mapa:", err);
  }

  // Ativa os listeners da página
  setupEventListeners();
});
