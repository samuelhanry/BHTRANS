// ================================================
// SCRIPT.JS — RASTREADOR DE ÔNIBUS BHTRANS
// ================================================


//PESSOA 1


// BLOCO 1: Variáveis globais
  //const UTM_ZONE = //...
  //let todasAsParadas = //...
  //let marcadoresParadas = //...


// BLOCO 2: converterUTM(x, y)


// BLOCO 3: carregarParadas()




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


// BLOCO 9: calcularDistancia() e destacarParadaMaisProxima()
  //let marcadorUsuario = //...
  //let marcadorProximo = ...


// TODAS AS PESSOAS


// BLOCO 10: Inicialização
  carregarParadas();
  atualizarOnibus();
  intervalo = setInterval(atualizarOnibus, 20000);