window.function = function (jsonInput) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  if (!rawInput) return "";

  // Pulizia Markdown
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // STILI CSS
  var cssTable = "width:100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; border: 1px solid #dfe2e5;";
  var cssTh = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap;";
  var cssTd = "border: 1px solid #dfe2e5; padding: 10px; vertical-align: top; color: #24292e; background-color: #fff;";
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
    // Se il JSON è un oggetto che contiene solo 1 chiave (es: {"data": [...]}), 
    // scendiamo di livello finché non troviamo la "ciccia" (Array o Oggetto complesso)
    while (data && typeof data === 'object' && !Array.isArray(data)) {
        var keys = Object.keys(data);
        if (keys.length === 1) {
            data = data[keys[0]]; // Entriamo dentro e scartiamo il guscio esterno
        } else {
            break; // Ci sono più chiavi, quindi è un dato reale, ci fermiamo
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
            // Header Union: Trova tutte le colonne possibili
            var keys = [];
            for (var i = 0; i < obj.length; i++) {
                var rowKeys = Object.keys(obj[i]);
                for (var k = 0; k < rowKeys.length; k++) {
                    if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
                }
            }

            var html = '<table style="' + cssTable + '"><thead><tr>';
            for (var h = 0; h < keys.length; h++) {
                // Qui usiamo formatHeader per renderle belle
                html += '<th style="' + cssTh + '">' + formatHeader(keys[h]) + '</th>';
            }
            html += '</tr></thead><tbody>';

            for (var r = 0; r < obj.length; r++) {
                var bg = (r % 2 === 0) ? "#fff" : "#f9f9f9"; // Righe alternate
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
          // Qui usiamo formatHeader e impostiamo larghezza fissa per l'etichetta
          objHtml += '<th style="' + cssTh + ' width: 30%;">' + formatHeader(keyName) + '</th>';
          objHtml += '<td style="' + cssTd + '">' + buildTable(value) + '</td>';
          objHtml += '</tr>';
      }
      objHtml += '</tbody></table>';
      return objHtml;
    }

    return '<div style="overflow-x:auto;">' + buildTable(data) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
