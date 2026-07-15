const UNITS = {
  "cras": [
    {
      "name": "CRAS Cristiana Vicente Nunes",
      "lat": 2.794228,
      "lng": -60.715304,
      "color": "red",
      "address": "Rua Santo Agostinho, 193 - Centenário",
      "phone": "(95) 98402-6617",
      "bairros": "13 de Setembro, Asa Branca, Buritis, Caimbé, Cambará, Centenário, Cinturão Verde, Jóquei Clube, Liberdade, Marechal Rondon, Nova Canaã, Olímpico, Pricumã, Professora Araceli Souto Maior, Tancredo Neves",
      "bairros_list": ["13 de Setembro", "Asa Branca", "Buritis", "Caimbé", "Cambará", "Centenário", "Cinturão Verde", "Jóquei Clube", "Liberdade", "Marechal Rondon", "Nova Canaã", "Olímpico", "Pricumã", "Professora Araceli Souto Maior", "Tancredo Neves"]
    },
    {
      "name": "CRAS Pintolândia",
      "lat": 2.810678170811167, // Coordenada precisa atualizada
      "lng": -60.7449722,        // Coordenada precisa atualizada
      "color": "blue",
      "address": "R. Sólon Rodrigues Pessoa, 937 - Pintolândia", // Endereço de texto atualizado
      "phone": "(95) 98407-3680",
      "bairros": "Dr. Silvio Botelho, Jardim Tropical, Pintolândia, Santa Luzia, Senador Hélio Campos",
      "bairros_list": ["Dr. Silvio Botelho", "Jardim Tropical", "Pintolândia", "Santa Luzia", "Senador Hélio Campos"]
    },
    {
      "name": "CRAS Nova Cidade",
      "lat": 2.763968,
      "lng": -60.730548,
      "color": "green",
      "address": "Rua Curitiba, 336 - Nova Cidade",
      "phone": "(95) 98403-0174",
      "bairros": "Bela Vista, Dr. Airton Rocha, Conjunto Pérola, Ajuricaba, Governador Aquilino Mota Duarte, Jardim Copaíbas, Distrito Industrial, Nova Cidade, Operário, Raiar do Sol, São Bento",
      "bairros_list": ["Bela Vista", "Dr. Airton Rocha", "Conjunto Pérola", "Ajuricaba", "Governador Aquilino Mota Duarte", "Jardim Copaíbas", "Distrito Industrial", "Nova Cidade", "Operário", "Raiar do Sol", "São Bento"]
    },
    {
      "name": "CRAS Dr. Silvio Leite",
      "lat": 2.824589,
      "lng": -60.744222,
      "color": "purple",
      "address": "R. Marieta de Mello Marquês, 869 - Dr. Silvio Leite",
      "phone": "(95) 98403-1682",
      "bairros": "Alvorada, Dr. Silvio Leite, Equatorial, Nova Esperança, Conjunto Cruviana, Jardim Primavera, Laura Moreira, Conjunto Cidadão, Conjunto Manaíra",
      "bairros_list": ["Alvorada", "Dr. Silvio Leite", "Equatorial", "Nova Esperança", "Conjunto Cruviana", "Jardim Primavera", "Laura Moreira", "Conjunto Cidadão", "Conjunto Manaíra"]
    },
    {
      "name": "CRAS União",
      "lat": 2.844086,
      "lng": -60.727368,
      "color": "orange",
      "address": "R. Hilda Sobral Guedes, 81 - Bairro União",
      "phone": "(95) 98405-9001",
      "bairros": "Cidade Satélite, Conjunto Universitário, Vila Jardim, João de Barro, Murilo Teixeira, Piscicultura, Santa Tereza, Jardim Caranã, União",
      "bairros_list": ["Cidade Satélite", "Conjunto Universitário", "Vila Jardim", "João de Barro", "Murilo Teixeira", "Piscicultura", "Santa Tereza", "Jardim Caranã", "União"]
    },
    {
      "name": "CRAS Cauamé",
      "lat": 2.828707,
      "lng": -60.699579,
      "color": "darkred",
      "address": "Av. Carlos Pereira de Melo, 207 - Jardim Floresta",
      "phone": "(95) 98410-1337",
      "bairros": "Aeroporto, Monte das Oliveiras, Cauamé, Caranã, Jardim Floresta, Said Salomão, Pedra Pintada",
      "bairros_list": ["Aeroporto", "Monte das Oliveiras", "Cauamé", "Caranã", "Jardim Floresta", "Said Salomão", "Pedra Pintada"]
    },
    {
      "name": "CRAS São Francisco",
      "lat": 2.817229,
      "lng": -60.666111,
      "color": "darkblue",
      "address": "R. Floriano Peixoto, 140 - Centro",
      "phone": "(95) 98410-4092",
      "bairros": "31 de Março, Caçari, Calungá, Canarinho, Centro, Dos Estados, Mecejana, Nossa Senhora de Aparecida, Paraviana, São Francisco, São Pedro, São Vicente",
      "bairros_list": ["31 de Março", "Caçari", "Calungá", "Canarinho", "Centro", "Dos Estados", "Mecejana", "Nossa Senhora de Aparecida", "Paraviana", "São Francisco", "São Pedro", "São Vicente"]
    },
    {
      "name": "CRAS Itinerante",
      "lat": 2.829942,
      "lng": -60.678552,
      "color": "cadetblue",
      "address": "R. Maj. Manoel Corrêa, 620 - São Francisco",
      "phone": "N/A",
      "bairros": "Comunidades Indígenas e Zona Rural de Boa Vista",
      "bairros_list": ["Comunidades Indígenas e Zona Rural de Boa Vista"]
    }
  ],
  "creas": [
    {
      "name": "CREAS Centenário",
      "lat": 2.7973795,
      "lng": -60.718835,
      "color": "blue",
      "address": "R. Turin, 282 - Centenário",
      "phone": "(95) 98412-1829",
      "desc": "Alvorada; Cambará; Centenário; Cinturão Verde; Cruviana; Dr. Airton Rocha; Dr. Sílvio Botelho; Dr. Sílvio Leite; Equatorial; Governador Aquilo da Mota Duarte; Jardim Bela Vista; Jardim das Copaíbas; Jóquei Clube; Nova Canaã; Olímpico; Araceli; Equatorial; Jardim Primavera; Tropical; Laura Moreira; Rondon; Manaíra; Murilo Teixeira; Operário; Pintolândia; Piscicultura; Raiar do Sol; São Bento; Santa Luzia; Hélio Campos",
      "area_list": ["Alvorada", "Cambará", "Centenário", "Cinturão Verde", "Cruviana", "Dr. Airton Rocha", "Dr. Sílvio Botelho", "Dr. Sílvio Leite", "Equatorial", "Governador Aquilo da Mota Duarte", "Jardim Bela Vista", "Jardim das Copaíbas", "Jóquei Clube", "Nova Canaã", "Olímpico", "Araceli", "Equatorial", "Jardim Primavera", "Tropical", "Laura Moreira", "Rondon", "Manaíra", "Murilo Teixeira", "Operário", "Pintolândia", "Piscicultura", "Raiar do Sol", "São Bento", "Santa Luzia", "Hélio Campos"]
    },
    {
      "name": "CREAS Centro",
      "lat": 2.8217647,
      "lng": -60.678314,
      "color": "darkblue",
      "address": "Av. Mário Homem de Melo, 514 - Centro",
      "phone": "(95) 98404-5621",
      "desc": "13 de Setembro; 31 de Março; Aeroporto; Aparecida; Área Rural e Indígena; Asa Branca; Buritis; Caçari; Caetano Filho; Caimbé; Calungá; Canarinho; Caranã; Cauamé; Centro; Cidade Satélite; Estados; Jardim Caranã; Jardim Floresta; João de Barro; Liberdade; Mecejana; Monte das Oliveiras; Paraviana; Pedra Pintada; Pricumã; Salomão; São Francisco; São Pedro; São Vicente; Tancredo Neves; União",
      "area_list": ["13 de Setembro", "31 de Março", "Aeroporto", "Aparecida", "Área Rural e Indígena", "Asa Branca", "Buritis", "Caçari", "Caetano Filho", "Caimbé", "Calungá", "Canarinho", "Caranã", "Cauamé", "Centro", "Cidade Satélite", "Estados", "Jardim Caranã", "Jardim Floresta", "João de Barro", "Liberdade", "Mecejana", "Monte das Oliveiras", "Paraviana", "Pedra Pintada", "Pricumã", "Salomão", "São Francisco", "São Pedro", "São Vicente", "Tancredo Neves", "União"]
    },
    {
      "name": "Abrigo Infantil Pedra Pintada",
      "lat": 2.7961607,
      "lng": -60.703623,
      "color": "green",
      "address": "R. Interna, 182 - Centenário",
      "phone": "Atendimento Direto",
      "desc": "Crianças de até 12 anos incompleto em situação de vulnerabilidade social",
      "area_list": []
    }
  ]
};
