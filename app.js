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

// ---------- 2. Normalização Avançada de Texto (Melhora muito a busca) ----------
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove pontuação e caracteres especiais
    .replace(/\s+/g, ' ') // Remove espaços duplicados
    .trim();
}

// ---------- 3. Construção do Índice de Busca Integrado ----------
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

// ---------- 4. Mecanismo de Busca (Sugestões em Tempo Real) ----------
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

  // Varre o índice por correspondência parcial
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

// ---------- 5. Renderizando as Sugestões com Design Limpo ----------
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

    // Cores fiéis aos equipamentos
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

// ---------- 5.1 Busca Direta (Apertar Enter / Filtrar e Ir) ----------
function executarBuscaDireta(termoDigitado) {
  const termoLimpo = normalizarTexto(termoDigitado);
  if (termoLimpo.length < 2) return;

  // Busca correspondências no índice global
  const correspondencias = SEARCH_INDEX.filter(item => item.text.includes(termoLimpo));
  
  // Remove unidades duplicadas do filtro da busca para termos resultados únicos
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

  // Força a visualização ir para a aba do mapa se não estiver nela
  trocarAba('map');

  // Esconde o menu de sugestões
  const suggestBox = document.getElementById('suggestBox');
  if (suggestBox) {
    suggestBox.classList.remove('show');
  }

  if (unidadesEncontradas.length === 1) {
    // CASO 1: Apenas 1 equipamento encontrado -> Foca diretamente nele
    focarUnidade(unidadesEncontradas[0]);
  } else {
    // CASO 2: Múltiplos equipamentos encontrados -> Ajusta o enquadramento do mapa para caber todos
    const bounds = L.latLngBounds();
    unidadesEncontradas.forEach(unit => {
      bounds.extend([unit.lat, unit.lng]);
    });

    // Ajusta o mapa com um espaçamento confortável nas bordas (padding)
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
      animate: true,
      duration: 1.5
    });
  }
}

// ---------- 6. Focar e Abrir Popup no Mapa ----------
function focarUnidade(unit) {
  if (!map) return;

  map.closePopup();

  map.flyTo([unit.lat, unit.lng], 16, {
    animate: true,
    duration: 1.2
  });

  setTimeout(() => {
    markersGroup.eachLayer(marker => {
      const latLng = marker.getLatLng();
      if (Math.abs(latLng.lat - unit.lat) < 0.0001 && Math.abs(latLng.lng - unit.lng) < 0.0001) {
        marker.openPopup();
      }
    });
  }, 1300);
}

// ---------- 7. Renderizar Pins de Google Maps e Listagem ----------
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
    // Cores idênticas aos pinos do Google Maps
    const pinColor = unit.kind === 'cras' ? '#0f9d58' : '#db4437'; // Verde Google e Vermelho Google

    // HTML do pino no estilo Google Maps (gota invertida estilizada com ícone svg)
    const googlePinHTML = `
      <div class="google-maps-pin" style="position: relative; width: 34px; height: 44px; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.35));">
        <!-- Parte triangular inferior -->
        <div style="position: absolute; bottom: 0; left: 12px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 10px solid ${pinColor};"></div>
        <!-- Círculo principal -->
        <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; background-color: ${pinColor}; border-radius: 50% 50% 50% 50%; display: flex; align-items: center; justify-content: center;">
          <!-- Ícone branco no meio (Home / Prédio Público) -->
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
      iconAnchor: [17, 44], // Fixa a ponta inferior da gota exatamente na coordenada geográfica
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

    L.marker([unit.lat, unit.lng], { icon: customIcon })
      .bindPopup(popupContent)
      .addTo(markersGroup);

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

// ---------- 11. Geolocalização Real do Usuário ----------
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

// ---------- 12. Listeners e Eventos Gerais ----------
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const suggestBox = document.getElementById('suggestBox');
  const clearBtn = document.getElementById('clearBtn');
  const chipCras = document.getElementById('chipCras');
  const chipCreas = document.getElementById('chipCreas');
  const locBtn = document.getElementById('locBtn');

  // Input de busca (Executa a pesquisa a cada caractere digitado)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => realizarBusca(e.target.value));
    
    // Força reavaliação ao clicar ou focar no campo
    searchInput.addEventListener('focus', (e) => {
      realizarBusca(e.target.value);
    });

    // Detecta clique no botão "ENTER" para ir direto aos equipamentos
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executarBuscaDireta(e.target.value);
      }
    });
  }

  // Botão Limpar Busca (✕)
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

  // Ocultar sugestões clicando fora do campo de busca
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

  // Cliques na Tabbar inferior
  document.querySelectorAll('nav.tabbar button').forEach(button => {
    button.addEventListener('click', () => {
      const targetView = button.getAttribute('data-view');
      trocarAba(targetView);
    });
  });
}

// ---------- 13. Inicialização DOMContentLoaded ----------
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
