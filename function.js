window.function = function (jsonInput, unwrapDepth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  var levelsToSkip = unwrapDepth ? parseInt(unwrapDepth.value) : 0;
  if (isNaN(levelsToSkip)) levelsToSkip = 0;

  if (!rawInput) return "";

  // Pulizia Markdown
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // --- STILI CSS ---
  // Aggiungiamo stili per il tag <details> e <summary>
  var cssTable = "width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; border: 1px solid #dfe2e5; table-layout: auto;";
  var cssTh = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 8px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap;";
  var cssTd = "border: 1px solid #dfe2e5; padding: 8px; vertical-align: top; color: #24292e; background-color: #fff; white-space: normal; word-wrap: break-word; min-width: 50px;";
  var cssNull = "color: #a0a0a0; font-style: italic;"; 
  var cssBool = "color: #005cc5; font-weight: bold;";

  // Stile per il bottone cliccabile
  var cssSummary = "cursor: pointer; color: #0366d6; font-weight: 500; outline: none; list-style: none;"; // list-style: none nasconde il triangolo default su alcuni browser
  
  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- LOGICA DI SBUSTAMENTO (UNWRAP) ---
    var currentLevel = 0;
    while (currentLevel < levelsToSkip && data && typeof data === 'object') {
        if (!Array.isArray(data)) {
            var keys = Object.keys(data);
            if (keys.length === 0) break;
            var targetKey = keys[0];
            if (keys.length > 1) {
                var arrayKey = keys.find(function(k) { return Array.isArray(data[k]); });
                if (arrayKey) targetKey = arrayKey;
                else {
                    var objectKey = keys.find(function(k) { return typeof data[k] === 'object' && data[k] !== null; });
                    if (objectKey) targetKey = objectKey;
                }
            }
            data = data[targetKey];
        } else {
             if (data.length > 0) data = data[0];
             else break;
        }
        currentLevel++;
    }

    // --- RENDERER ---
    // isRoot serve per capire se siamo alla tabella principale (che non va nascosta)
    function buildTable(obj, isRoot) {
      if (obj === null || obj === undefined) return '<span style="' + cssNull + '">null</span>';
      
      // Primitivi
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + cssBool + '">' + obj + '</span>';
         return String(obj);
      }

      // Se è un oggetto complesso e NON siamo alla radice, prepariamo il wrapper <details>
      // Ma prima dobbiamo generare il contenuto HTML interno
      var contentHtml = "";
      var itemCount = Array.isArray(obj) ? obj.length + " items" : Object.keys(obj).length + " campi";

      // --- LOGICA GENERAZIONE TABELLA (uguale a prima) ---
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
            contentHtml += '<table style="' + cssTable + '"><thead><tr>';
            for (var h = 0; h < keys.length; h++) {
                contentHtml += '<th style="' + cssTh + '">' + formatHeader(keys[h]) + '</th>';
            }
            contentHtml += '</tr></thead><tbody>';
            for (var r = 0; r < obj.length; r++) {
                var bg = (r % 2 === 0) ? "#fff" : "#f9f9f9"; 
                contentHtml += '<tr style="background-color:' + bg + '">';
                for (var c = 0; c < keys.length; c++) {
                    contentHtml += '<td style="' + cssTd + '">' + buildTable(obj[r][keys[c]], false) + '</td>';
                }
                contentHtml += '</tr>';
            }
            contentHtml += '</tbody></table>';
        } else {
            // Lista semplice
            contentHtml += '<table style="' + cssTable + '"><tbody>';
            for (var i = 0; i < obj.length; i++) {
                contentHtml += '<tr><td style="' + cssTd + '">' + buildTable(obj[i], false) + '</td></tr>';
            }
            contentHtml += '</tbody></table>';
        }
      } 
      // Oggetto Singolo
      else {
          var keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          contentHtml += '<table style="' + cssTable + '"><tbody>';
          for (var k = 0; k < keys.length; k++) {
              contentHtml += '<tr>';
              contentHtml += '<th style="' + cssTh + ' width: 30%; white-space: normal;">' + formatHeader(keys[k]) + '</th>';
              contentHtml += '<td style="' + cssTd + '">' + buildTable(obj[keys[k]], false) + '</td>';
              contentHtml += '</tr>';
          }
          contentHtml += '</tbody></table>';
      }

      // --- QUI AGGIUNGIAMO L'INTERATTIVITÀ ---
      // Se è la tabella principale (isRoot = true), restituiamo tutto aperto.
      // Se è una sotto-tabella (isRoot = false), la chiudiamo dentro <details>.
      if (isRoot) {
          return contentHtml;
      } else {
          // Usiamo un'emoji o un testo per far capire che è cliccabile
          // summary è l'unica cosa visibile finché non clicchi
          return `
            <details>
                <summary style="${cssSummary}">▶ Mostra (${itemCount})</summary>
                <div style="margin-top: 5px;">${contentHtml}</div>
            </details>
          `;
      }
    }

    return '<div style="overflow-x:auto;">' + buildTable(data, true) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
