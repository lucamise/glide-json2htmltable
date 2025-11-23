window.function = function (jsonInput) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  if (!rawInput) return "";

  // Pulizia Markdown
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // STILI CSS
  // MODIFICA 1: width: 100% -> La tabella occupa tutto lo spazio disponibile ma non di più.
  // table-layout: auto -> L'algoritmo del browser decide la larghezza delle colonne in base al contenuto (effetto fit-content).
  var cssTable = "width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; border: 1px solid #dfe2e5; table-layout: auto;";
  
  // MODIFICA 2: Headers (Intestazioni)
  // white-space: nowrap -> Le intestazioni le teniamo su una riga se possibile, è più elegante.
  var cssTh = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 8px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap;";
  
  // MODIFICA 3: Celle Dati
  // white-space: normal -> FONDAMENTALE: permette al testo di andare a capo se è troppo lungo.
  // word-break: break-word -> Se c'è una parola lunghissima (es. un URL), la spezza per non creare overflow.
  // min-width: 50px -> Assicura che la colonna non diventi illeggibile (troppo stretta).
  var cssTd = "border: 1px solid #dfe2e5; padding: 8px; vertical-align: top; color: #24292e; background-color: #fff; white-space: normal; word-wrap: break-word; min-width: 50px;";
  
  var cssNull = "color: #a0a0a0; font-style: italic;"; 
  var cssBool = "color: #005cc5; font-weight: bold;";

  // FORMATTER
  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- LOGICA DI SBUSTAMENTO (UNWRAP) ---
    while (data && typeof data === 'object' && !Array.isArray(data)) {
        var keys = Object.keys(data);
        if (keys.length === 1) {
            data = data[keys[0]]; 
        } else {
            break; 
        }
    }

    // --- FUNZIONE PRINCIPALE RICORSIVA ---
    function buildTable(obj) {
      
      // CASO 1: Nullo
      if (obj === null || obj === undefined) return '<span style="' + cssNull + '">null</span>';
      
      // CASO 2: Primitivi
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + cssBool + '">' + obj + '</span>';
         return String(obj);
      }

      // CASO 3: ARRAY
      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";
        
        var isListOfObjects = typeof obj[0] === 'object' && obj[0] !== null;

        if (isListOfObjects) {
            // Header Union
            var keys = [];
            for (var i = 0; i < obj.length; i++) {
                var rowKeys = Object.keys(obj[i]);
                for (var k = 0; k < rowKeys.length; k++) {
                    if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
                }
            }

            var html = '<table style="' + cssTable + '"><thead><tr>';
            for (var h = 0; h < keys.length; h++) {
                html += '<th style="' + cssTh + '">' + formatHeader(keys[h]) + '</th>';
            }
            html += '</tr></thead><tbody>';

            for (var r = 0; r < obj.length; r++) {
                var bg = (r % 2 === 0) ? "#fff" : "#f9f9f9"; 
                html += '<tr style="background-color:' + bg + '">';
                for (var c = 0; c < keys.length; c++) {
                    var key = keys[c];
                    var val = obj[r][key];
                    html += '<td style="' + cssTd + '">' + buildTable(val) + '</td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table>';
            return html;

        } else {
            // Lista semplice
            var listHtml = '<table style="' + cssTable + '"><tbody>';
            for (var i = 0; i < obj.length; i++) {
                listHtml += '<tr><td style="' + cssTd + '">' + buildTable(obj[i]) + '</td></tr>';
            }
            listHtml += '</tbody></table>';
            return listHtml;
        }
      }

      // CASO 4: OGGETTO SINGOLO (Verticale)
      var keys = Object.keys(obj);
      if (keys.length === 0) return "{}";

      var objHtml = '<table style="' + cssTable + '"><tbody>';
      for (var k = 0; k < keys.length; k++) {
          var keyName = keys[k];
          var value = obj[keyName];
          objHtml += '<tr>';
          // Qui mettiamo width: 30% all'header per dare coerenza, il resto si adatta
          objHtml += '<th style="' + cssTh + ' width: 30%; white-space: normal;">' + formatHeader(keyName) + '</th>';
          objHtml += '<td style="' + cssTd + '">' + buildTable(value) + '</td>';
          objHtml += '</tr>';
      }
      objHtml += '</tbody></table>';
      return objHtml;
    }

    // Manteniamo overflow-x: auto nel wrapper per sicurezza estrema (es. tabelle con 20 colonne)
    return '<div style="overflow-x:auto;">' + buildTable(data) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
