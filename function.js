window.function = function (jsonInput, unwrapDepth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  
  // Leggiamo quanti livelli saltare (Default 0)
  var levelsToSkip = unwrapDepth ? parseInt(unwrapDepth.value) : 0;
  if (isNaN(levelsToSkip)) levelsToSkip = 0;

  if (!rawInput) return "";

  // Pulizia Markdown
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // STILI CSS (Fit-content + Text wrap + No Overflow)
  var cssTable = "width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; border: 1px solid #dfe2e5; table-layout: auto;";
  var cssTh = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 8px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap;";
  var cssTd = "border: 1px solid #dfe2e5; padding: 8px; vertical-align: top; color: #24292e; background-color: #fff; white-space: normal; word-wrap: break-word; min-width: 50px;";
  var cssNull = "color: #a0a0a0; font-style: italic;"; 
  var cssBool = "color: #005cc5; font-weight: bold;";

  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- LOGICA DI SBUSTAMENTO MANUALE (MANUAL UNWRAP) ---
    // Scendiamo di livello esattamente quante volte richiesto dall'utente
    var currentLevel = 0;
    while (currentLevel < levelsToSkip && data && typeof data === 'object') {
        
        // Se siamo finiti su un array, di solito non si scende oltre (a meno che non sia array di array)
        // Ma se è un oggetto, dobbiamo scegliere in quale chiave entrare.
        if (!Array.isArray(data)) {
            var keys = Object.keys(data);
            if (keys.length === 0) break; // Vicolo cieco

            var targetKey = keys[0]; // Default: prendiamo la prima chiave

            if (keys.length > 1) {
                // Se ci sono più chiavi, cerchiamo quella più "interessante"
                // 1. Cerchiamo se c'è una chiave che contiene una LISTA (Array)
                var arrayKey = keys.find(function(k) { return Array.isArray(data[k]); });
                
                if (arrayKey) {
                    targetKey = arrayKey;
                } else {
                    // 2. Altrimenti cerchiamo una chiave che sia un OGGETTO
                    var objectKey = keys.find(function(k) { return typeof data[k] === 'object' && data[k] !== null; });
                    if (objectKey) targetKey = objectKey;
                }
            }
            // Entriamo nel livello successivo
            data = data[targetKey];
        } else {
             // Se è un array e ci chiedono di saltare ancora livelli, proviamo a prendere il primo elemento
             // Esempio: [[...]] -> saltiamo il guscio esterno
             if (data.length > 0) {
                 data = data[0];
             } else {
                 break;
             }
        }
        currentLevel++;
    }

    // --- RENDERER ---
    function buildTable(obj) {
      if (obj === null || obj === undefined) return '<span style="' + cssNull + '">null</span>';
      
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + cssBool + '">' + obj + '</span>';
         return String(obj);
      }

      // CASO ARRAY
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
            var listHtml = '<table style="' + cssTable + '"><tbody>';
            for (var i = 0; i < obj.length; i++) {
                listHtml += '<tr><td style="' + cssTd + '">' + buildTable(obj[i]) + '</td></tr>';
            }
            listHtml += '</tbody></table>';
            return listHtml;
        }
      }

      // CASO OGGETTO SINGOLO
      var keys = Object.keys(obj);
      if (keys.length === 0) return "{}";

      var objHtml = '<table style="' + cssTable + '"><tbody>';
      for (var k = 0; k < keys.length; k++) {
          var keyName = keys[k];
          var value = obj[keyName];
          objHtml += '<tr>';
          objHtml += '<th style="' + cssTh + ' width: 30%; white-space: normal;">' + formatHeader(keyName) + '</th>';
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
