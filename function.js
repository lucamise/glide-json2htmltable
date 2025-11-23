window.function = function (jsonInput) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  if (!rawInput) return "";

  // Pulizia Markdown
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // STILI CSS (Puliti e professionali, simili al sito di riferimento)
  // Usiamo classi inline perché in Glide non possiamo caricare un CSS esterno facilmente
  var cssTable = "width:100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; border: 1px solid #dfe2e5;";
  var cssTh = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px; font-weight: 600; text-align: left; color: #24292e;";
  var cssTd = "border: 1px solid #dfe2e5; padding: 10px; vertical-align: top; color: #24292e; background-color: #fff;";
  var cssNull = "color: #a0a0a0; font-style: italic;"; // Per valori nulli
  var cssBool = "color: #005cc5; font-weight: bold;";   // Per true/false

  try {
    var data = JSON.parse(rawInput);

    // --- FUNZIONE PRINCIPALE RICORSIVA ---
    // Questa funzione decide cosa disegnare in base al tipo di dato che riceve
    function buildTable(obj) {
      
      // CASO 1: Nullo o Undefined
      if (obj === null || obj === undefined) return '<span style="' + cssNull + '">null</span>';
      
      // CASO 2: Primitivi (Testo, Numeri, Booleani)
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + cssBool + '">' + obj + '</span>';
         return String(obj);
      }

      // CASO 3: ARRAY (Lista)
      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]"; // Lista vuota
        
        // Controlliamo se è una lista di oggetti o di valori semplici
        var isListOfObjects = typeof obj[0] === 'object' && obj[0] !== null;

        if (isListOfObjects) {
            // È una tabella vera e propria!
            // STEP A: Troviamo TUTTE le chiavi uniche da TUTTE le righe (Logica "All Columns")
            var keys = [];
            for (var i = 0; i < obj.length; i++) {
                var rowKeys = Object.keys(obj[i]);
                for (var k = 0; k < rowKeys.length; k++) {
                    if (keys.indexOf(rowKeys[k]) === -1) {
                        keys.push(rowKeys[k]);
                    }
                }
            }

            // STEP B: Costruiamo la tabella HTML
            var html = '<table style="' + cssTable + '"><thead><tr>';
            for (var h = 0; h < keys.length; h++) {
                html += '<th style="' + cssTh + '">' + keys[h] + '</th>';
            }
            html += '</tr></thead><tbody>';

            for (var r = 0; r < obj.length; r++) {
                html += '<tr>';
                for (var c = 0; c < keys.length; c++) {
                    var key = keys[c];
                    var val = obj[r][key];
                    // RICORSIONE: Chiamiamo buildTable per il contenuto della cella
                    html += '<td style="' + cssTd + '">' + buildTable(val) + '</td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table>';
            return html;

        } else {
            // È una lista semplice (es. ["mela", "pera"])
            // Creiamo una tabellina a una colonna o una lista puntata
            var listHtml = '<table style="' + cssTable + '"><tbody>';
            for (var i = 0; i < obj.length; i++) {
                listHtml += '<tr><td style="' + cssTd + '">' + buildTable(obj[i]) + '</td></tr>';
            }
            listHtml += '</tbody></table>';
            return listHtml;
        }
      }

      // CASO 4: OGGETTO SINGOLO
      // Creiamo una tabella verticale (Chiave | Valore)
      var keys = Object.keys(obj);
      if (keys.length === 0) return "{}";

      var objHtml = '<table style="' + cssTable + '"><tbody>';
      for (var k = 0; k < keys.length; k++) {
          var keyName = keys[k];
          var value = obj[keyName];
          objHtml += '<tr>';
          objHtml += '<th style="' + cssTh + ' width: 30%;">' + keyName + '</th>';
          // RICORSIONE: Anche qui, se il valore è complesso, genererà un'altra tabella dentro
          objHtml += '<td style="' + cssTd + '">' + buildTable(value) + '</td>';
          objHtml += '</tr>';
      }
      objHtml += '</tbody></table>';
      return objHtml;
    }

    // Avviamo la generazione avvolgendo tutto in un div per lo scroll orizzontale
    return '<div style="overflow-x:auto;">' + buildTable(data) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
