window.function = function (jsonInput) {
  var rawInput = jsonInput ? jsonInput.value : "";
  if (!rawInput) return "";

  // Pulizia input
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    var jsonData = JSON.parse(rawInput);
    if (!Array.isArray(jsonData)) jsonData = [jsonData]; // Normalizziamo a lista
    if (jsonData.length === 0) return "";

    // 1. LOGICA "INTELLIGENTE" (presa dal tuo codice)
    // Cerchiamo TUTTE le chiavi uniche in tutto il JSON, non solo nel primo elemento
    var col = [];
    for (var i = 0; i < jsonData.length; i++) {
        for (var key in jsonData[i]) {
            // Se la colonna non è ancora nella lista, la aggiungiamo
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }

    // Funzione helper per rendere sicuri i valori nulli o oggetti
    function formatValue(val) {
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val); // Semplificazione per oggetti annidati
        return val;
    }

    // 2. COSTRUZIONE STRINGA HTML (Metodo richiesto da Glide)
    // Invece di document.createElement, usiamo stringhe di testo
    var styleTable = "width:100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; border: 1px solid #ddd;";
    var styleTh = "background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; text-align: left; color: #333;";
    var styleTd = "border: 1px solid #ddd; padding: 10px; vertical-align: top; color: #444;";

    var html = '<div style="overflow-x:auto;">';
    html += '<table style="' + styleTable + '">';

    // Intestazioni (Headers)
    html += '<thead><tr>';
    for (var k = 0; k < col.length; k++) {
        // Mettiamo la prima lettera maiuscola
        var headerName = col[k].charAt(0).toUpperCase() + col[k].slice(1);
        html += '<th style="' + styleTh + '">' + headerName + '</th>';
    }
    html += '</tr></thead>';

    // Righe (Rows)
    html += '<tbody>';
    for (var i = 0; i < jsonData.length; i++) {
        var bg = (i % 2 === 0) ? "#ffffff" : "#f9f9f9";
        html += '<tr style="background-color: ' + bg + ';">';
        
        for (var j = 0; j < col.length; j++) {
            var key = col[j];
            // Se questo oggetto non ha quella chiave, restituisce undefined -> formatValue lo rende vuoto
            var val = jsonData[i][key]; 
            html += '<td style="' + styleTd + '">' + formatValue(val) + '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';

    return html;

  } catch (e) {
    return "Errore JSON: " + e.message;
  }
};
