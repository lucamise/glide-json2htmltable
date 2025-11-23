window.function = function (jsonInput, unwrapDepth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  var levelsToSkip = unwrapDepth ? parseInt(unwrapDepth.value) : 0;
  if (isNaN(levelsToSkip)) levelsToSkip = 0;

  if (!rawInput) return "";

  // Pulizia
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // --- STILI CSS INLINE ---
  var s = {
      table: "width: 100%; border-collapse: collapse; font-family: -apple-system, sans-serif; font-size: 13px; border: 1px solid #dfe2e5; table-layout: auto;",
      th: "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 8px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap;",
      td: "border: 1px solid #dfe2e5; padding: 8px; vertical-align: top; color: #24292e; background-color: #fff; white-space: normal; word-wrap: break-word; min-width: 50px;",
      // Summary: Rimuoviamo outline brutti, mettiamo cursore a manina
      summary: "cursor: pointer; outline: none; padding: 4px 0; font-family: monospace; font-size: 12px;",
      // Label dentro il summary (quella blu)
      summaryLabel: "color: #0366d6; font-weight: 600; background: #f1f8ff; padding: 2px 6px; border-radius: 4px;",
      nullVal: "color: #a0a0a0; font-style: italic;",
      bool: "color: #005cc5; font-weight: bold;"
  };

  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- UNWRAP LOGIC ---
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
    function buildTable(obj, isRoot) {
      if (obj === null || obj === undefined) return '<span style="' + s.nullVal + '">null</span>';
      
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + s.bool + '">' + obj + '</span>';
         return String(obj);
      }

      // Preparazione Contenuto
      var contentHtml = "";
      
      // CREIAMO L'ETICHETTA PER IL BOTTONE
      // Esempio: "3 Items" o "User Details"
      // Usiamo termini inglesi standard o simboli perché sono più brevi su mobile
      var infoLabel = Array.isArray(obj) ? obj.length + " righe" : Object.keys(obj).length + " campi";

      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";
        var isListOfObjects = typeof obj[0] === 'object' && obj[0] !== null;

        if (isListOfObjects) {
            var keys = [];
            for (var i = 0; i < obj.length; i++) {
                var rowKeys = Object.keys(obj[i]);
                for (var k = 0; k < rowKeys.length; k++) {
                    if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
                }
            }
            contentHtml += `<table style="${s.table}"><thead><tr>`;
            for (var h = 0; h < keys.length; h++) {
                contentHtml += `<th style="${s.th}">${formatHeader(keys[h])}</th>`;
            }
            contentHtml += '</tr></thead><tbody>';
            for (var r = 0; r < obj.length; r++) {
                var bg = (r % 2 === 0) ? "#fff" : "#f9f9f9"; 
                contentHtml += `<tr style="background-color:${bg}">`;
                for (var c = 0; c < keys.length; c++) {
                    contentHtml += `<td style="${s.td}">${buildTable(obj[r][keys[c]], false)}</td>`;
                }
                contentHtml += '</tr>';
            }
            contentHtml += '</tbody></table>';
        } else {
            contentHtml += `<table style="${s.table}"><tbody>`;
            for (var i = 0; i < obj.length; i++) {
                contentHtml += `<tr><td style="${s.td}">${buildTable(obj[i], false)}</td></tr>`;
            }
            contentHtml += '</tbody></table>';
        }
      } 
      else {
          var keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          contentHtml += `<table style="${s.table}"><tbody>`;
          for (var k = 0; k < keys.length; k++) {
              contentHtml += '<tr>';
              contentHtml += `<th style="${s.th} width: 30%; white-space: normal;">${formatHeader(keys[k])}</th>`;
              contentHtml += `<td style="${s.td}">${buildTable(obj[keys[k]], false)}</td>`;
              contentHtml += '</tr>';
          }
          contentHtml += '</tbody></table>';
      }

      // --- OUTPUT ---
      if (isRoot) {
          return contentHtml;
      } else {
          // MODIFICA QUI:
          // Non scriviamo "Apri/Chiudi". Mettiamo solo l'etichetta stilizzata tipo "Badge".
          // Il tag <details> aggiungerà automaticamente il triangolo ▶ a sinistra.
          return `
            <details>
                <summary style="${s.summary}">
                   <span style="${s.summaryLabel}">${infoLabel}</span>
                </summary>
                <div style="margin-top: 8px; margin-left: 5px; border-left: 2px solid #eee; padding-left: 5px;">
                    ${contentHtml}
                </div>
            </details>
          `;
      }
    }

    return '<div style="overflow-x:auto;">' + buildTable(data, true) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
