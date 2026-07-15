/**
 * SISTEMA DE MAPA DE GEOLOCALIZAÇÃO - REDE SUAS BOA VISTA
 * Arquivo: app.js (Versão Otimizada com Abertura Automática de Popup)
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
  const defaultCenter = [2.8197, -60.6732]; 
  const defaultZoom = 13;

  map = L.map('map', {
    zoomControl: false 
  }).setView(defaultCenter, defaultZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);

  // Carrega e desenha o mapa
  updateMapAndList();
}

// ---------- 2. Normalização de Texto para Busca ----------
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove pontuação
    .replace(/\s+/g, ' ') // Remove espaços duplicados
    .trim();
}

// ---------- 3. Construção do Índice de Busca ----------
function buildSearchIndex() {
  const index = [];

  if (typeof UNITS === 'undefined') {
    console.error("ERRO: O arquivo 'data.js' não foi carregado corretamente.");
    return [];
  }

  // Processa CRAS
  if (UNITS.cras) {
    UNITS.cras.forEach(unit => {
      index.push({ text: normalizarTexto(unit.name), unit: unit, type: 'cras', matchType: 'Unidade' });
      index.push({ text: normalizarTexto(unit.address), unit: unit, type: 'cras', matchType: 'Endereço' });

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

  // Processa CREAS
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

// ---------- 4. Mecanismo de Sugestões em Tempo Real ----------
function realizarBusca(termoDigitado) {
  const suggestBox = document.getElementById('suggestBox');
  const clearBtn = document.getElementById('clearBtn');
   
  if (!suggestBox) return;

  const termoLimpo = normalizarTexto(termoDigitado);

  if (clearBtn) {
    clearBtn.style.display = termoDigitado.trim().length > 0 ? 'flex' : 'none';
  }

  if (termoLimpo.length < 2) {
    suggestBox.classList.remove('show');
    suggestBox.innerHTML = '';
    return;
  }

  const correspondencias = SEARCH_INDEX.filter(item => item.text.includes(termoLimpo));

  const resultadosUnicos = [];
  const cacheIds = new Set();

  correspondencias.forEach(item => {
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

  renderSugestoes(resultadosUnicos.slice(0, 6));
}

// ---------- 5. Renderizar Sugestões no Painel ----------
function renderSugestoes(lista) {
  const suggestBox = document.getElementById('suggestBox');
  if (!suggestBox) return;

  if (lista.length === 0) {
    suggestBox.innerHTML = '<div style="padding:14px; text-align:center; font-size:13.5px; color:var(--ink-soft);">Nenhum resultado encontrado</div>';
    suggestBox.classList.add('show');
    return;
  }

  suggestBox.innerHTML = '';

  lista.forEach(item => {
    const sitem = document.createElement('div');
    sitem.className = 'sitem';

    const corIndicador = item.type === 'cras' ? 'var(--jungle, #27ae60)' : 'var(--creas-red, #e74c3c)';

    sitem.innerHTML = `
      <div class="dotc" style="background-color: ${corIndicador}"></div>
      <div class="stext">
        <b>${item.matchedText}</b>
        <span>${item.unit.name} • ${item.matchType}</span>
      </div>
    `;

    sitem.addEventListener('click', () => {
      trocarAba('map');
      focarUnidade(item.unit);
      
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = item.matchedText;
      
      suggestBox.classList.remove('show');
    });

    suggestBox.appendChild(sitem);
  });

  suggestBox.classList.add('show');
}

// ---------- 6. Executar Busca Direta ao Pressionar Enter ----------
function executarBuscaDireta(termoDigitado) {
  const termoLimpo = normalizarTexto(termoDigitado);
  if (termoLimpo.length < 2) return;

  const correspondencias = SEARCH_INDEX.filter(item => item.text.includes(termoLimpo));
  
  const unidadesEncontradas = [];
  const nomesAdicionados = new Set();

  correspondencias.forEach(item => {
    if (!nomesAdicionados.has(item.unit.name)) {
      nomesAdicionados.add(item.unit.name);
      unidadesEncontradas.push(item.unit);
    }
  });

  if (unidadesEncontradas.length === 0) {
    alert("Nenhum equipamento da rede SUAS foi encontrado para esta busca.");
    return;
  }

  trocarAba('map');

  const suggestBox = document.getElementById('suggestBox');
  if (suggestBox) {
    suggestBox.classList.remove('show');
  }

  if (unidadesEncontradas.length === 1) {
    // Foca diretamente no único equipamento encontrado e abre sua descrição
    focarUnidade(unidadesEncontradas[0]);
  } else {
    // Múltiplos resultados: Enquadra todos no campo de visão
    const bounds = L.latLngBounds();
    unidadesEncontradas.forEach(unit => {
      bounds.extend([unit.lat, unit.lng]);
    });

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
      animate: true,
      duration: 1.2
    });
  }
}

// ---------- 7. Focar e Abrir Caixa de Descrição (Popup) ----------
function focarUnidade(unit) {
  if (!map) return;

  // Fecha qualquer outro popup aberto anteriormente
  map.closePopup();

  // Move a câmera com suavidade
  map.flyTo([unit.lat, unit.lng], 16, {
    animate: true,
    duration: 1.2
  });

  // Aguarda o fim do zoom (1.2s) para abrir a caixa de informações
  setTimeout(() => {
    if (unit.marker) {
      unit.marker.openPopup();
    }
  }, 1250);
}

// ---------- 8. Atualizar Mapa e Lista de Cards ----------
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

  unidadesParaMostrar.forEach(unit => {
    const pinColor = unit.kind === 'cras' ? '#0f9d58' : '#db4437'; 

    const googlePinHTML = `
      <div class="google-maps-pin" style="position: relative; width: 34px; height: 44px; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.35));">
        <div style="position: absolute; bottom: 0; left: 12px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 10px solid ${pinColor};"></div>
        <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; background-color: ${pinColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'google-custom-marker',
      html: googlePinHTML,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -40]
    });

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
      </div>
    `;

    // Cria o marcador e salva a referência dele diretamente no objeto 'unit'
    const marker = L.marker([unit.lat, unit.lng], { icon: customIcon })
      .bindPopup(popupContent)
      .addTo(markersGroup);
    
    unit.marker = marker; 

    // Renderiza nos Cards da aba Unidades
    if (containerLista) {
      const card = document.createElement('div');
      card.className = 'card';
      const stripeColor = unit.kind === 'cras' ? '#0f9d58' : '#db4437';

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

// ---------- 9. Alternar Sanfona de Bairros nos Cards ----------
window.alternarVisibilidadeBairros = function(elementoClicado) {
  const bairrosListDiv = elementoClicado.nextElementSibling;
  if (bairrosListDiv && bairrosListDiv.classList.contains('bairros-list')) {
    const estaVisivel = bairrosListDiv.classList.toggle('show');
    elementoClicado.textContent = estaVisivel ? "Ocultar bairros atendidos ▲" : "Ver bairros atendidos ▼";
  }
};

// ---------- 10. Ação "Ver no Mapa" no Card de Listagem ----------
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

// ---------- 11. Alternar Visualizações (Abas) ----------
function trocarAba(viewId) {
  document.querySelectorAll('nav.tabbar button').forEach(btn => {
    if (btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('main .view').forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  if (viewId === 'map' && map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}

// ---------- 12. Localizar Usuário pelo GPS ----------
function obterGeolocalizacao() {
  if (!navigator.geolocation) {
    alert("Geolocalização não é suportada por seu navegador.");
    return;
  }

  const locBtn = document.getElementById('locBtn');
  if (locBtn) locBtn.style.color = '#F2994A'; 

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (locBtn) locBtn.style.color = 'var(--deep-blue)';

      map.setView([lat, lng], 15);

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

// ---------- 13. Vinculação de Eventos do Usuário ----------
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const suggestBox = document.getElementById('suggestBox');
  const clearBtn = document.getElementById('clearBtn');
  const chipCras = document.getElementById('chipCras');
  const chipCreas = document.getElementById('chipCreas');
  const locBtn = document.getElementById('locBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => realizarBusca(e.target.value));
    
    searchInput.addEventListener('focus', (e) => {
      realizarBusca(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executarBuscaDireta(e.target.value);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      if (suggestBox) {
        suggestBox.classList.remove('show');
        suggestBox.innerHTML = '';
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (suggestBox && searchInput && !searchInput.contains(e.target) && !suggestBox.contains(e.target)) {
      suggestBox.classList.remove('show');
    }
  });

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

  if (locBtn) {
    locBtn.addEventListener('click', obterGeolocalizacao);
  }

  document.querySelectorAll('nav.tabbar button').forEach(button => {
    button.addEventListener('click', () => {
      const targetView = button.getAttribute('data-view');
      trocarAba(targetView);
    });
  });
}

// ---------- 14. Inicialização Principal ----------
window.addEventListener('DOMContentLoaded', () => {
  if (typeof UNITS !== 'undefined') {
    SEARCH_INDEX = buildSearchIndex();
    ALL_UNITS = [
      ...UNITS.cras.map(u => ({ ...u, kind: 'cras' })),
      ...UNITS.creas.map(u => ({ ...u, kind: 'creas' }))
    ];
  } else {
    console.error("Variável UNITS não declarada. Verifique data.js.");
  }

  try {
    initMap();
  } catch (err) {
    console.error("Falha ao criar instância do mapa:", err);
  }

  setupEventListeners();
});
