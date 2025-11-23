window.function = function (jsonInput, unwrapDepth, screenWidth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  var levelsToSkip = unwrapDepth ? parseInt(unwrapDepth.value) : 0;
  if (isNaN(levelsToSkip)) levelsToSkip = 0;

  // --- LOGICA BREAKPOINT ---
  // Leggiamo la larghezza in pixel. Se non c'è, assumiamo desktop (1024)
  var widthVal = screenWidth ? Number(screenWidth.value) : 1024;
  
  // IL TUO BREAKPOINT: 400px
  // Se è <= 400px, attiviamo la modalità Mobile
  var isMobile = !isNaN(widthVal) && widthVal <= 400;

  if (!rawInput) return "";

  // Pulizia
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // --- STILI CSS DINAMICI ---
  var s = {};

  if (isMobile) {
      // --- MOBILE (<= 400px) ---
      // Layout verticale: Intestazione sopra, Dato sotto.
      s.table = "width: 100%; border-collapse: collapse; font-family: -apple-system, sans-serif; font-size: 13px; border: none;";
      
      // TH: Diventa una piccola etichetta grigia sopra il dato
      s.th = "display: block; width: 100%; background: transparent; border: none; padding: 10px 0 2px 0; font-weight: 700; text-align: left; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;";
      
      // TD: Il dato prende tutto lo spazio
      s.td = "display: block; width: 100%; border: none; border-bottom: 1px solid #f0f0f0; padding: 0 0 10px 0; vertical-align: top; color: #333; background: transparent; word-wrap: break-word;";
      
      s.container = "overflow-x:hidden;"; 

  } else {
      // --- DESKTOP (> 400px) ---
      // Tabella classica affiancata
      s.table = "width: 100%; border-collapse: collapse; font-family: -apple-system, sans-serif; font-size: 13px; border: 1px solid #dfe2e5; table-layout: auto;";
      s.th = "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 10px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap; width: 30%;";
      s.td = "border: 1px solid #dfe2e5; padding: 10px; vertical-align: top; color: #24292e; background-color: #fff; white-space: normal; word-wrap: break-word; min-width: 150px;";
      s.container = "overflow-x:auto;";
  }

  // Stili Comuni (Accordion e Label)
  s.summary = "cursor: pointer; outline: none; padding: 6px 0; font-family: monospace; font-size: 12px; display: block; width: 100%;";
  s.summaryLabel = "color: #0366d6; font-weight: 600; background: #f1f8ff; padding: 4px 8px; border-radius: 4px; display: inline-block;";
  s.nullVal = "color: #a0a0a0; font-style: italic;";
  s.bool = "color: #005cc5; font-weight: bold;";

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

      var contentHtml = "";
      var infoLabel = Array.isArray(obj) ? obj.length + " righe" : Object.keys(obj).length + " campi";

      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";
        var isListOfObjects = typeof obj[0] === 'object' && obj[0] !== null;

        if (isListOfObjects) {
            // Lista di Oggetti
            var keys = [];
            for (var i = 0; i < obj.length; i++) {
                var rowKeys = Object.keys(obj[i]);
                for (var k = 0; k < rowKeys.length; k++) {
                    if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
                }
            }
            
            // Logica Ibrida per la Root su Mobile: 
            // Se è la tabella principale (root) e siamo su mobile, manteniamo lo scroll orizzontale
            // Altrimenti (se è un accordion annidato) usiamo lo stile verticale (stacked).
            var localTableStyle = s.table;
            var localThStyle = s.th;
            var localTdStyle = s.td;

            if (isMobile && isRoot) {
                localTableStyle = "width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px; border: 1px solid #eee;";
                localThStyle = "background: #f9f9f9; padding: 8px; font-weight: bold; border: 1px solid #eee; white-space: nowrap;";
                localTdStyle = "padding: 8px; border: 1px solid #eee; min-width: 100px;";
            }

            contentHtml += `<table style="${localTableStyle}"><thead><tr>`;
            for (var h = 0; h < keys.length; h++) {
                contentHtml += `<th style="${localThStyle}">${formatHeader(keys[h])}</th>`;
            }
            contentHtml += '</tr></thead><tbody>';
            for (var r = 0; r < obj.length; r++) {
                var bg = (r % 2 === 0 && !isMobile) ? "#fff" : (isMobile ? "transparent" : "#f9f9f9"); 
                contentHtml += `<tr style="background-color:${bg}">`;
                for (var c = 0; c < keys.length; c++) {
                    contentHtml += `<td style="${localTdStyle}">${buildTable(obj[r][keys[c]], false)}</td>`;
                }
                contentHtml += '</tr>';
            }
            contentHtml += '</tbody></table>';
        } else {
            // Lista Semplice
            contentHtml += `<table style="${s.table}"><tbody>`;
            for (var i = 0; i < obj.length; i++) {
                contentHtml += `<tr><td style="${s.td}">${buildTable(obj[i], false)}</td></tr>`;
            }
            contentHtml += '</tbody></table>';
        }
      } 
      else {
          // OGGETTO SINGOLO (Verticale)
          var keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          contentHtml += `<table style="${s.table}"><tbody>`;
          for (var k = 0; k < keys.length; k++) {
              contentHtml += '<tr>';
              contentHtml += `<th style="${s.th}">${formatHeader(keys[k])}</th>`;
              contentHtml += `<td style="${s.td}">${buildTable(obj[keys[k]], false)}</td>`;
              contentHtml += '</tr>';
          }
          contentHtml += '</tbody></table>';
      }

      // --- OUTPUT ---
      if (isRoot) {
          return contentHtml;
      } else {
          return `
            <details>
                <summary style="${s.summary}">
                   <span style="${s.summaryLabel}">▶ ${infoLabel}</span>
                </summary>
                <div style="margin-top: 5px; padding-left: 0;">
                    ${contentHtml}
                </div>
            </details>
          `;
      }
    }

    return `<div style="${s.container}">` + buildTable(data, true) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
