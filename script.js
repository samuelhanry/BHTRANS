// ================================================
// SCRIPT.JS — RASTREADOR DE ÔNIBUS BHTRANS
// ================================================


//PESSOA 1

// BLOCO 1: Variáveis globais

const utmFormat = "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

let todasAsParadas = [];
let marcadoresParadas =[];

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
            id: parada.ID_PONTO_ONIBUS,
            identificador: parada.IDENTIFICADOR_PONTO_ONIBUS,
            lat,
            lng,
            geometria
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


// BLOCO 5: Variáveis de controle
  //const URL_API = //...
  //let marcadoresOnibus = //...
  //let intervalo = //...
  //let linhaAtiva = //...


// BLOCO 6: atualizarOnibus()




// PESSOA 3


// BLOCO 7: filtrarLinha() e limparFiltro()


// BLOCO 8: mostrarParadasDaLinha(linha)


// BLOCO 9: Geolocalização e parada mais próxima

let marcadorUsuario = null;
let marcadorProximo = null;

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


// TODAS AS PESSOAS


// BLOCO 10: Inicialização
  carregarParadas();
  atualizarOnibus();
  intervalo = setInterval(atualizarOnibus, 20000);
