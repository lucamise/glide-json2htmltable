window.function = function (jsonInput) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  if (!rawInput) return "";

  // Pulizia Markdown
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // STILI CSS
  // MODIFICA 1: width: auto (invece di 100%) -> La tabella si restringe al contenuto
  var cssTable = "width: auto; min-width: 50%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; border: 1px solid #dfe2e5;";
  
  // MODIFICA 2: white-space: nowrap -> Le intestazioni non vanno mai a capo
  var cssTh = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 15px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap;";
  
  // MODIFICA 3: white-space: nowrap -> Anche i dati cercano di stare su una riga (stile Excel)
  var cssTd = "border: 1px solid #dfe2e5; padding: 10px 15px; vertical-align: top; color: #24292e; background-color: #fff; white-space: nowrap;";
  
  var cssNull = "color: #a0a0a0; font-style: italic;"; 
  var cssBool = "color: #005cc5; font-weight: bold;";

  // FORMATTER: Pulisce le intestazioni (es. "user_id" -> "User id")
  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- LOGICA DI SBUSTAMENTO (UNWRAP) ---
    // Scarta i gusci esterni inutili (es. {"data": ...})
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
      
      // CASO 1: Nullo o Undefined
      if (obj === null || obj === undefined) return '<span style="' + cssNull + '">null</span>';
      
      // CASO 2: Primitivi
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + cssBool + '">' + obj + '</span>';
         return String(obj);
      }

      // CASO 3: ARRAY (Lista)
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
          // Qui header rimane largo il giusto, senza percentuali fisse
          objHtml += '<th style="' + cssTh + '">' + formatHeader(keyName) + '</th>';
          objHtml += '<td style="' + cssTd + '">' + buildTable(value) + '</td>';
          objHtml += '</tr>';
      }
      objHtml += '</tbody></table>';
      return objHtml;
    }

    return '<div style="overflow-x:auto; padding-bottom: 5px;">' + buildTable(data) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
