// ================================================
// SCRIPT.JS — RASTREADOR DE ÔNIBUS BHTRANS
// ================================================


//PESSOA 1

// BLOCO 1: Variáveis globais

const utmFormat = "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

let todasAsParadas = [];
let marcadoresParadas =[];
let paradasLayer;
let marcadorProximo = null;
let posicaoUsuario = null;

// BLOCO 2: 

//Conversão de Coordenadas (UTM para Leaflet)
//Configuração para Proj4js (SIRGAS 2000 / UTM zone 23S)


function converterUTM(x,y){
  const coords = proj4(utmFormat, "EPSG:4326", [x, y]);
  return [coords[1], coords[0]]; // Retorna [Lat, Lng]
}

// BLOCO 3: Carregar paradas

async function carregarParadas() {

  Papa.parse("data/ponto_onibus.csv", {

      download: true,
      header: true, // Usa a primeira linha como cabeçalho
      skipEmptyLines: true,

      complete: function(results) {

        todasAsParadas = results.data.map(parada => {

          const geometria = parada.GEOMETRIA;
          const match = geometria.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/);

          if (!match) return null;

          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          const [lat, lng] = converterUTM(x, y);

          return {
            id: parada.IDENTIFICADOR_PONTO_ONIBUS,
            codLinha: String(parada.COD_LINHA).trim(),
            nomeLinha: parada.NOME_LINHA,
            lat,
            lng
          };


        }).filter(p => p !== null);

        console.log("Paradas carregadas:", todasAsParadas.length);
      },

      error: function(error) {
        console.error("Erro ao carregar CSV:", error);
      }

  });

}




//PESSOA 2


// BLOCO 4: Configuração do mapa
const mapa = L.map("mapa").setView([-19.917, -43.934], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(mapa);

paradasLayer = L.layerGroup().addTo(mapa);

// BLOCO 5: Variáveis de controle

const URL_API = "https://corsproxy.io/?url=https://temporeal.pbh.gov.br/?param=D";

let marcadoresOnibus = [];
let intervalo = null;
let linhaAtiva = null;



// BLOCO 6: atualizarOnibus()

async function atualizarOnibus() {

  try {

    const response = await fetch(URL_API);
    const data = await response.json();

    // limpa ônibus antigos do mapa
    marcadoresOnibus.forEach(marker => {
      mapa.removeLayer(marker);
    });

    marcadoresOnibus = [];


    // verifica onde está a lista de veículos
    const veiculos = data.VEIC || data.veiculos || data;

    veiculos.forEach(onibus => {

      // tenta pegar os campos da API
      const linha = onibus.LINHA || onibus.linha;
      const lat = parseFloat(onibus.LAT || onibus.lat);
      const lng = parseFloat(onibus.LON || onibus.lon || onibus.lng);

      // ignora coordenadas inválidas
      if (isNaN(lat) || isNaN(lng)) return;

      // se houver filtro ativo, mostra só a linha filtrada
      if (linhaAtiva && linha !== linhaAtiva) return;


      // marcador simples (mais leve para muitos ônibus)
      const marcador = L.circleMarker([lat, lng], {

        radius: 4,
        color: "#0066FF",
        fillOpacity: 0.8

      })
      .addTo(mapa)
      .bindPopup("Linha: " + linha);


      marcadoresOnibus.push(marcador);

    });

    console.log("Ônibus atualizados:", marcadoresOnibus.length);

  }
  catch(error) {

    console.error("Erro ao buscar ônibus:", error);

  }

}


// PESSOA 3


// BLOCO 7: filtrarLinha() e limparFiltro()

function limparMarcadores() {
    marcadoresOnibus.forEach(marker => mapa.removeLayer(marker));
    marcadoresOnibus = [];
}

function filtrarLinha() {
    const input = document.getElementById("inputLinha").value.trim().toUpperCase();
    if (!input) return;

    linhaAtiva = input;
    limparMarcadores();
    mostrarParadasDaLinha(linhaAtiva);
    atualizarOnibus();

    document.getElementById("btnLimpar").classList.remove("d-none");
    document.getElementById("statusFiltro").textContent = `Filtrando linha: ${linhaAtiva}`;
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(atualizarOnibus, 20000);
}

function limparFiltro() {
    linhaAtiva = null;

    paradasLayer.clearLayers();
    if (marcadorProximo) {
        mapa.removeLayer(marcadorProximo); 
        marcadorProximo = null;
    }

    limparMarcadores();
    atualizarOnibus();

    document.getElementById("btnLimpar").classList.add("d-none");
    document.getElementById("statusFiltro").textContent = "";
    document.getElementById("inputLinha").value = "";
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(atualizarOnibus, 20000);
}


// BLOCO 8: mostrarParadasDaLinha(linha)

function mostrarParadasDaLinha(linha) {

    paradasLayer.clearLayers();

    if (marcadorProximo) {
        mapa.removeLayer(marcadorProximo);
        marcadorProximo = null;
    }

    const paradas = todasAsParadas.filter(p => p.codLinha === String(linha).trim());


    if (paradas.length === 0) {
        console.warn(`Nenhuma parada encontrada para a linha ${linha}`);
        return;
    }

 
    paradas.forEach(p => {
        L.circleMarker([p.lat, p.lng], {
            radius: 6,
            color: "#1565C0",
            fillColor: "#42A5F5",
            fillOpacity: 0.9,
            weight: 1.5
        })
        .bindPopup(`<b>Ponto ${p.id}</b><br>${p.nomeLinha}`)
        .addTo(paradasLayer);
    });


    if (posicaoUsuario) {
        let menorDist = Infinity;
        let paradaMaisProxima = null;

        paradas.forEach(p => {
            const dist = mapa.distance(posicaoUsuario, [p.lat, p.lng]); 
            if (dist < menorDist) {
                menorDist = dist;
                paradaMaisProxima = p;
            }
        });

        if (paradaMaisProxima) {
            marcadorProximo = L.circleMarker([paradaMaisProxima.lat, paradaMaisProxima.lng], {
                radius: 10,
                color: "#B71C1C",
                fillColor: "#EF5350",
                fillOpacity: 1,
                weight: 2.5
            })
            .bindPopup(`<b>Ponto mais próximo</b><br>Ponto ${paradaMaisProxima.id}<br>${paradaMaisProxima.nomeLinha}<br><i>${Math.round(menorDist)}m de distância</i>`)
            .addTo(mapa)

            .openPopup();
        }
    }

    const bounds = L.latLngBounds(paradas.map(p => [p.lat, p.lng]));
    mapa.fitBounds(bounds, { padding: [40, 40] }); // >>> CORRIGIDO: map → mapa
}


// BLOCO 9: Geolocalização e parada mais próxima

let marcadorUsuario = null;

function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function destacarParadaMaisProxima(paradas) {
  navigator.geolocation.getCurrentPosition(
    function(posicao) {
      const latUsuario = posicao.coords.latitude;
      const lngUsuario = posicao.coords.longitude;

      // Marca a posição do usuário no mapa
      if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
      marcadorUsuario = L.circleMarker([latUsuario, lngUsuario], {
        radius: 8,
        color: "#00CC00",
        fillOpacity: 1
      }).addTo(mapa).bindPopup("Você está aqui").openPopup();

      // Encontra a parada mais próxima
      let paradaMaisProxima = null;
      let menorDistancia = Infinity;

      paradas.forEach(function(parada) {
        const dist = calcularDistancia(latUsuario, lngUsuario, parada.lat, parada.lng);
        if (dist < menorDistancia) {
          menorDistancia = dist;
          paradaMaisProxima = parada;
        }
      });

      // Destaca a parada mais próxima em vermelho
      if (marcadorProximo) mapa.removeLayer(marcadorProximo);
      marcadorProximo = L.circleMarker([paradaMaisProxima.lat, paradaMaisProxima.lng], {
        radius: 10,
        color: "#FF0000",
        fillOpacity: 1
      }).addTo(mapa).bindPopup("Parada mais próxima: " + paradaMaisProxima.nome).openPopup();

    },
    function() {
      alert("Não foi possível obter sua localização.");
    }
  );
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        function(posicao) {
            posicaoUsuario = L.latLng(posicao.coords.latitude, posicao.coords.longitude);
            if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
            marcadorUsuario = L.circleMarker(posicaoUsuario, {
                radius: 8,
                color: "#00CC00",
                fillOpacity: 1
            }).addTo(mapa).bindPopup("Você está aqui");
            if (linhaAtiva) mostrarParadasDaLinha(linhaAtiva);
        },
        function() {
            console.warn("Não foi possível obter sua localização.");
        }
    );
}

// TODAS AS PESSOAS


// BLOCO 10: Inicialização
  carregarParadas();
  atualizarOnibus();
  intervalo = setInterval(atualizarOnibus, 20000);
