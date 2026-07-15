# Rede SUAS Boa Vista

Aplicativo web (PWA) para localizar o **CRAS** e o **CREAS** mais próximo em
Boa Vista - RR, com mapa interativo, busca por bairro e informações de
contato de cada unidade.

## Funcionalidades

- 🗺️ Mapa com as 8 unidades de CRAS e 3 unidades de CREAS da cidade
- 🔍 Busca por bairro ou nome da unidade
- 📞 Ligação direta e rota no Google Maps a partir de cada unidade
- 📍 Localização do usuário no mapa
- 📱 Instalável na tela inicial do Android/iOS como um app nativo (PWA)

## Como publicar no GitHub Pages

1. Faça o upload de todos os arquivos deste repositório para a **raiz**
   (não em subpasta).
2. No repositório: **Settings → Pages → Source** → selecione a branch
   `main` e a pasta `/ (root)` → **Save**.
3. Após 1–2 minutos, o link estará disponível em:
   ```
   https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
   ```

## Como instalar no celular

Abra o link publicado no Chrome (Android) ou Safari (iPhone) e:

- **Android (Chrome):** menu (⋮) → "Instalar aplicativo" ou
  "Adicionar à tela inicial"
- **iPhone (Safari):** botão de compartilhar (□↑) → "Adicionar à Tela de
  Início"

O ícone aparece na tela inicial e abre em tela cheia, como um app nativo.

## Estrutura do projeto

```
index.html      - estrutura e visual do app
app.js          - lógica (mapa, busca, listagem, navegação entre abas)
data.js         - dados dos CRAS e CREAS de Boa Vista (endereços, telefones, bairros atendidos)
manifest.json   - configuração de instalação (PWA)
sw.js           - service worker para funcionamento offline do app shell
icon-*.png      - ícones do aplicativo
vendor/leaflet/ - biblioteca de mapas Leaflet, hospedada localmente (não depende de CDN externo)
```

> A biblioteca de mapas (Leaflet) fica hospedada dentro do próprio
> repositório, em `vendor/leaflet/`, em vez de vir de um CDN externo.
> Isso evita que o mapa (e a busca por bairro, que depende dele) pare
> de funcionar por causa de bloqueios de rede, adblockers ou
> instabilidade do CDN.

## Atualizando os dados das unidades

Os dados de cada unidade (nome, endereço, telefone, bairros atendidos)
ficam em `data.js`, dentro do objeto `UNITS`, separados em `cras` e
`creas`. Basta editar esse arquivo para adicionar, remover ou corrigir
uma unidade — não é necessário mexer em `app.js`.

## Gerando um .apk (opcional)

Depois de publicado o link do GitHub Pages, é possível gerar um `.apk`
instalável (inclusive para a Play Store) usando o
[PWABuilder](https://www.pwabuilder.com), gratuito:

1. Cole a URL do site publicado
2. Clique em "Package for Stores" → Android
3. Baixe o `.apk` gerado

## Créditos

Mapas base: [OpenStreetMap](https://www.openstreetmap.org/copyright) ·
Biblioteca de mapas: [Leaflet](https://leafletjs.com/)
