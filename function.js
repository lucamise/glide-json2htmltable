window.function = function (jsonInput, unwrapDepth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  var levelsToSkip = unwrapDepth ? parseInt(unwrapDepth.value) : 0;
  if (isNaN(levelsToSkip)) levelsToSkip = 0;

  if (!rawInput) return "";

  // Pulizia
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // ID univoco per evitare conflitti di stile se usi più plugin nella stessa pagina
  var uid = "t" + Math.random().toString(36).substr(2, 5);

  // --- CSS AVANZATO (Magic Toggle) ---
  var styles = `
    <style>
      .${uid}-table { width: 100%; border-collapse: collapse; font-family: -apple-system, sans-serif; font-size: 13px; border: 1px solid #dfe2e5; table-layout: auto; }
      .${uid}-th { background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px 8px; font-weight: 600; text-align: left; color: #24292e; white-space: nowrap; }
      .${uid}-td { border: 1px solid #dfe2e5; padding: 8px; vertical-align: top; color: #24292e; background-color: #fff; white-space: normal; word-wrap: break-word; min-width: 50px; }
      
      /* Stile del bottone Summary */
      .${uid}-summary {
        cursor: pointer;
        color: #0366d6;
        font-weight: 500;
        outline: none;
        list-style: none; /* Nasconde il triangolo di default (Firefox/Standard) */
      }
      .${uid}-summary::-webkit-details-marker {
        display: none; /* Nasconde il triangolo di default (Chrome/Safari) */
      }

      /* MAGIA: Testo quando CHIUSO */
      .${uid}-summary::after {
        content: "▶ Mostra " attr(data-label);
      }

      /* MAGIA: Testo quando APERTO */
      details[open] > .${uid}-summary::after {
        content: "▼ Nascondi " attr(data-label);
        color: #24292e; /* Diventa nero quando aperto per meno distrazione */
      }
    </style>
  `;

  var cssNull = "color: #a0a0a0; font-style: italic;"; 
  var cssBool = "color: #005cc5; font-weight: bold;";

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
      if (obj === null || obj === undefined) return '<span style="' + cssNull + '">null</span>';
      
      if (typeof obj !== 'object') {
         if (typeof obj === 'boolean') return '<span style="' + cssBool + '">' + obj + '</span>';
         return String(obj);
      }

      // Preparazione Contenuto
      var contentHtml = "";
      // Calcoliamo l'etichetta (es: "3 items") da passare al CSS
      var labelInfo = Array.isArray(obj) ? "(" + obj.length + " righe)" : "(" + Object.keys(obj).length + " campi)";

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
            contentHtml += `<table class="${uid}-table"><thead><tr>`;
            for (var h = 0; h < keys.length; h++) {
                contentHtml += `<th class="${uid}-th">${formatHeader(keys[h])}</th>`;
            }
            contentHtml += '</tr></thead><tbody>';
            for (var r = 0; r < obj.length; r++) {
                var bg = (r % 2 === 0) ? "#fff" : "#f9f9f9"; 
                contentHtml += `<tr style="background-color:${bg}">`;
                for (var c = 0; c < keys.length; c++) {
                    contentHtml += `<td class="${uid}-td">${buildTable(obj[r][keys[c]], false)}</td>`;
                }
                contentHtml += '</tr>';
            }
            contentHtml += '</tbody></table>';
        } else {
            contentHtml += `<table class="${uid}-table"><tbody>`;
            for (var i = 0; i < obj.length; i++) {
                contentHtml += `<tr><td class="${uid}-td">${buildTable(obj[i], false)}</td></tr>`;
            }
            contentHtml += '</tbody></table>';
        }
      } 
      else {
          var keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          contentHtml += `<table class="${uid}-table"><tbody>`;
          for (var k = 0; k < keys.length; k++) {
              contentHtml += '<tr>';
              contentHtml += `<th class="${uid}-th" style="width: 30%; white-space: normal;">${formatHeader(keys[k])}</th>`;
              contentHtml += `<td class="${uid}-td">${buildTable(obj[keys[k]], false)}</td>`;
              contentHtml += '</tr>';
          }
          contentHtml += '</tbody></table>';
      }

      // --- OUTPUT ---
      if (isRoot) {
          return contentHtml;
      } else {
          // NOTA: Il tag <summary> è VUOTO. Il testo viene inserito dal CSS (::after)
          // usando il valore dentro data-label.
          return `
            <details>
                <summary class="${uid}-summary" data-label="${labelInfo}"></summary>
                <div style="margin-top: 8px;">${contentHtml}</div>
            </details>
          `;
      }
    }

    // Uniamo Stili + HTML
    return styles + '<div style="overflow-x:auto;">' + buildTable(data, true) + '</div>';

  } catch (e) {
    return '<div style="color:red; border:1px solid red; padding:10px;">Invalid JSON: ' + e.message + '</div>';
  }
};
