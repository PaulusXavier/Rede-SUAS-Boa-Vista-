/**
 * SISTEMA DE MAPA DE GEOLOCALIZAÇÃO - ASSISTÊNCIA SOCIAL (CRAS E CREAS)
 * Arquivo: app.js
 */

// ---------- Variáveis Globais ----------
let map;
let markersGroup;
let SEARCH_INDEX = [];
let ALL_UNITS = [];
let activeFilters = { cras: true, creas: true };

// ---------- 1. Inicialização do Mapa ----------
function initMap() {
  // Coordenadas centrais aproximadas de Boa Vista - RR
  const defaultCenter = [2.8197, -60.6732]; 
  const defaultZoom = 13;

  // Criação do mapa Leaflet
  map = L.map('map', {
    zoomControl: false // Desativado para posicionarmos no canto direito depois
  }).setView(defaultCenter, defaultZoom);

  // Adicionando camada de mapa (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Reposiciona o controle de zoom para o canto superior direito
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Cria o grupo de marcadores para facilitar a limpeza e atualização
  markersGroup = L.layerGroup().addTo(map);

  // Inicializa a renderização dos pins e da lista lateral
  updateMapAndList();
}

// ---------- 2. Normalização de Texto (Segurança da Busca) ----------
// Remove acentos, caracteres especiais, maiúsculas e espaços extras
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD') // Decompõe letras acentuadas
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .trim();
}

// ---------- 3. Construção do Índice de Busca ----------
// Mapeia todas as possibilidades de termos que o usuário pode digitar
function buildSearchIndex() {
  const index = [];

  if (typeof UNITS === 'undefined') {
    console.error("ERRO: O arquivo 'data.js' não foi carregado corretamente ou a variável 'UNITS' está ausente.");
    return [];
  }

  // Mapeando Unidades CRAS
  if (UNITS.cras) {
    UNITS.cras.forEach(unit => {
      // Indexa o nome e endereço da unidade
      index.push({ text: normalizarTexto(unit.name), unit: unit, type: 'cras', matchType: 'Unidade' });
      index.push({ text: normalizarTexto(unit.address), unit: unit, type: 'cras', matchType: 'Endereço' });

      // Indexa cada bairro atendido individualmente
      if (Array.isArray(unit.bairros_list)) {
        unit.bairros_list.forEach(bairro => {
          index.push({
            text: normalizarTexto(bairro),
            unit: unit,
            type: 'cras',
            matchType: `Bairro atendido pelo ${unit.name}`,
            originalName: bairro
          });
        });
      }
    });
  }

  // Mapeando Unidades CREAS (e Abrigos listados no bloco creas)
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
            matchType: `Bairro atendido pelo ${unit.name}`,
            originalName: bairro
          });
        });
      }
    });
  }

  return index;
}

// ---------- 4. Mecanismo de Busca Dinâmica ----------
function realizarBusca(termoDigitado) {
  const inputBusca = document.getElementById('search-input');
  const suggestionsContainer = document.getElementById('suggestions-container');
  
  if (!suggestionsContainer) return;

  const termoLimpo = normalizarTexto(termoDigitado);

  // Se o campo estiver vazio ou com apenas 1 letra, esconde as sugestões
  if (termoLimpo.length < 2) {
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '';
    return;
  }

  // Filtra as correspondências dentro do índice inteligente
  const correspondencias = SEARCH_INDEX.filter(item => item.text.includes(termoLimpo));

  // Remove resultados duplicados para a mesma unidade física
  const unidadesUnicas = [];
  const cacheNomes = new Set();

  correspondencias.forEach(item => {
    const chaveUnica = `${item.unit.name}-${item.matchType === 'Unidade' ? 'unidade' : item.originalName || ''}`;
    if (!cacheNomes.has(chaveUnica)) {
      cacheNomes.add(chaveUnica);
      unidadesUnicas.push({
        unit: item.unit,
        type: item.type,
        matchType: item.matchType,
        matchedText: item.originalName || item.unit.name
      });
    }
  });

  // Limita a exibição a no máximo 6 sugestões para não poluir a tela
  renderSugestoes(unidadesUnicas.slice(0, 6));
}

// ---------- 5. Renderização das Sugestões na Tela ----------
function renderSugestoes(listaSugestoes) {
  const suggestionsContainer = document.getElementById('suggestions-container');
  
  if (listaSugestoes.length === 0) {
    suggestionsContainer.innerHTML = '<div class="suggestion-item empty-msg">Nenhum bairro ou unidade encontrado</div>';
    suggestionsContainer.style.display = 'block';
    return;
  }

  suggestionsContainer.innerHTML = '';
  suggestionsContainer.style.display = 'block';

  listaSugestoes.forEach(sugestao => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    
    // Identificador visual de cor do serviço (CRAS ou CREAS)
    const tagClass = sugestao.type === 'cras' ? 'badge-cras' : 'badge-creas';
    const tagLabel = sugestao.type.toUpperCase();

    // Cria a estrutura visual da sugestão
    div.innerHTML = `
      <div class="suggestion-info">
        <span class="suggestion-title">${sugestao.matchedText}</span>
        <span class="suggestion-subtitle">${sugestao.unit.name}</span>
      </div>
      <span class="badge ${tagClass}">${tagLabel}</span>
    `;

    // Evento de clique: centraliza a unidade correspondente no mapa e abre o popup
    div.addEventListener('click', () => {
      focarUnidade(sugestao.unit);
      document.getElementById('search-input').value = sugestao.matchedText;
      suggestionsContainer.style.display = 'none';
    });

    suggestionsContainer.appendChild(div);
  });
}

// ---------- 6. Ações ao Clicar / Focar Unidade ----------
function focarUnidade(unit) {
  if (!map) return;

  // Fecha qualquer popup atualmente aberto
  map.closePopup();

  // Voa suavemente até as coordenadas da unidade
  map.flyTo([unit.lat, unit.lng], 16, {
    animate: true,
    duration: 1.2
  });

  // Aguarda o fim da animação do mapa para disparar o popup com precisão
  setTimeout(() => {
    markersGroup.eachLayer(marker => {
      const latLng = marker.getLatLng();
      if (latLng.lat === unit.lat && latLng.lng === unit.lng) {
        marker.openPopup();
      }
    });
  }, 1300);
}

// ---------- 7. Renderização dos Marcadores e da Lista Lateral ----------
function updateMapAndList() {
  if (!markersGroup) return;
  markersGroup.clearLayers();

  const listaLateral = document.getElementById('units-list');
  if (listaLateral) listaLateral.innerHTML = '';

  // Filtra as unidades ativas com base nos botões de filtro (CRAS/CREAS)
  const itensParaMostrar = [];

  if (activeFilters.cras && UNITS.cras) {
    UNITS.cras.forEach(u => itensParaMostrar.push({ ...u, kind: 'cras' }));
  }
  if (activeFilters.creas && UNITS.creas) {
    UNITS.creas.forEach(u => itensParaMostrar.push({ ...u, kind: 'creas' }));
  }

  itensParaMostrar.forEach(unit => {
    // 1. Adicionando Marcador no Mapa
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin" style="background-color: ${unit.color || '#3388ff'}"></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -40]
    });

    const popupContent = `
      <div class="map-popup">
        <h3>${unit.name}</h3>
        <p><strong>Endereço:</strong> ${unit.address}</p>
        <p><strong>Telefone:</strong> ${unit.phone || 'Não disponível'}</p>
        ${unit.bairros ? `<p class="popup-coverage"><strong>Abrangência:</strong> ${unit.bairros}</p>` : ''}
      </div>
    `;

    const marker = L.marker([unit.lat, unit.lng], { icon: markerIcon })
      .bindPopup(popupContent)
      .addTo(markersGroup);

    // 2. Adicionando Item na Lista Lateral
    if (listaLateral) {
      const card = document.createElement('div');
      card.className = `unit-card ${unit.kind}`;
      card.style.borderLeftColor = unit.color;
      card.innerHTML = `
        <div class="card-header">
          <h4>${unit.name}</h4>
          <span class="badge badge-${unit.kind}">${unit.kind.toUpperCase()}</span>
        </div>
        <p class="card-address"><i class="icon-map-pin"></i> ${unit.address}</p>
        <p class="card-phone"><i class="icon-phone"></i> ${unit.phone || 'N/A'}</p>
      `;

      // Clique no card centraliza a unidade no mapa
      card.addEventListener('click', () => focarUnidade(unit));
      listaLateral.appendChild(card);
    }
  });
}

// ---------- 8. Eventos de Configuração de Interface ----------
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const btnCras = document.getElementById('filter-cras');
  const btnCreas = document.getElementById('filter-creas');

  // Monitora a digitação no campo de busca
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      realizarBusca(e.target.value);
    });

    // Se o usuário clicar fora do campo ou das sugestões, esconde a caixinha
    document.addEventListener('click', (e) => {
      if (suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
      }
    });
  }

  // Gerenciamento dos botões de Filtro (CRAS)
  if (btnCras) {
    btnCras.addEventListener('click', () => {
      activeFilters.cras = !activeFilters.cras;
      btnCras.classList.toggle('active', activeFilters.cras);
      updateMapAndList();
    });
  }

  // Gerenciamento dos botões de Filtro (CREAS)
  if (btnCreas) {
    btnCreas.addEventListener('click', () => {
      activeFilters.creas = !activeFilters.creas;
      btnCreas.classList.toggle('active', activeFilters.creas);
      updateMapAndList();
    });
  }
}

// ---------- 9. Inicialização Geral da Página ----------
window.addEventListener('DOMContentLoaded', () => {
  // 1. Reconstrói o índice de busca inteligente baseado no data.js
  if (typeof UNITS !== 'undefined') {
    SEARCH_INDEX = buildSearchIndex();
    
    // Cria uma lista unificada plana das unidades caso precise
    ALL_UNITS = [
      ...UNITS.cras.map(u => ({ ...u, kind: 'cras' })),
      ...UNITS.creas.map(u => ({ ...u, kind: 'creas' }))
    ];
  } else {
    console.error("ERRO CRÍTICO: Objeto 'UNITS' não encontrado no escopo global. Certifique-se de carregar o data.js antes do app.js.");
  }

  // 2. Inicializa o mapa Leaflet
  try {
    initMap();
  } catch (err) {
    console.error('Não foi possível iniciar o mapa Leaflet:', err);
  }

  // 3. Ativa os ouvintes de clique e digitação
  setupEventListeners();
});
