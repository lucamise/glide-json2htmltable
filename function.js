window.function = function (jsonInput, screenSize) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  
  // Leggiamo la dimensione ("small", "medium", "large")
  var sizeVal = screenSize ? screenSize.value : "";
  // Normalizziamo in minuscolo per evitare errori (es. "Small" -> "small")
  sizeVal = sizeVal.toLowerCase().trim();

  if (!rawInput) return "";

  // Pulizia input JSON
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // --- LOGICA RESPONSIVE ---
  // Attiviamo la modalità mobile solo se Glide dice che lo schermo è "small"
  var isMobile = (sizeVal === "small" || sizeVal === "mobile");

  // --- STILI INLINE ---
  var s = {
    // Container
    container: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #333;",
    
    // Desktop (Tabella)
    table: "width:100%; border-collapse: collapse; border: 1px solid #dfe2e5;",
    th: "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px; font-weight: 600; text-align: left; white-space: nowrap;",
    td: "border: 1px solid #dfe2e5; padding: 10px; vertical-align: top;",
    
    // Mobile (Cards)
    card: "border: 1px solid #e1e4e8; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05);",
    cardRow: "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding: 8px 0;",
    cardLabel: "font-weight: 600; color: #666; font-size: 0.85em; text-transform: uppercase; margin-right: 15px;",
    cardVal: "text-align: right; word-break: break-word; flex: 1;", // flex:1 spinge il testo a occupare lo spazio
    
    // Utilities
    boolTrue: "color: #2ea043; font-weight: bold;",
    boolFalse: "color: #d73a49; font-weight: bold;",
    nullVal: "color: #ccc; font-style: italic;"
  };

  // Formatter Header (es. customer_id -> Customer id)
  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- RENDERER DEI VALORI (Ricorsivo) ---
    function renderValue(val) {
      if (val === null || val === undefined) return `<span style="${s.nullVal}">null</span>`;
      if (typeof val === 'boolean') return `<span style="${val ? s.boolTrue : s.boolFalse}">${val}</span>`;
      
      if (typeof val === 'object') {
        if (Array.isArray(val)) {
            if (val.length === 0) return "[]";
            // Liste annidate: piccolo elenco puntato
            return `<ul style="margin:0; padding-left:15px; text-align:left;">${val.map(v => `<li>${renderValue(v)}</li>`).join('')}</ul>`;
        }
        // Oggetti annidati: key-value compatti
        return Object.keys(val).map(k => `<div><strong>${k}:</strong> ${renderValue(val[k])}</div>`).join('');
      }
      return String(val);
    }

    var html = `<div style="${s.container}">`;

    // --- GESTIONE ARRAY ---
    if (Array.isArray(data)) {
      if (data.length === 0) return "";
      var isListOfObjects = typeof data[0] === 'object' && data[0] !== null;

      if (isListOfObjects) {
        // Troviamo tutte le colonne (Header Union)
        var keys = [];
        for (var i = 0; i < data.length; i++) {
            var rowKeys = Object.keys(data[i]);
            for (var k = 0; k < rowKeys.length; k++) {
                if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
            }
        }

        // --- RAMO MOBILE (Cards) ---
        if (isMobile) {
            for (var r = 0; r < data.length; r++) {
                html += `<div style="${s.card}">`;
                for (var c = 0; c < keys.length; c++) {
                    var key = keys[c];
                    var val = data[r][key];
                    // Card Row: Label a sinistra | Valore a destra
                    html += `<div style="${s.cardRow}">`;
                    html += `<div style="${s.cardLabel}">${formatHeader(key)}</div>`;
                    html += `<div style="${s.cardVal}">${renderValue(val)}</div>`;
                    html += `</div>`;
                }
                html += `</div>`;
            }
        } 
        // --- RAMO DESKTOP (Table) ---
        else {
            html += `<div style="overflow-x:auto;"><table style="${s.table}"><thead><tr>`;
            for (var h = 0; h < keys.length; h++) {
                html += `<th style="${s.th}">${formatHeader(keys[h])}</th>`;
            }
            html += `</tr></thead><tbody>`;
            
            for (var r = 0; r < data.length; r++) {
                var bg = (r % 2 === 0) ? "#ffffff" : "#f9f9f9";
                html += `<tr style="background-color:${bg}">`;
                for (var c = 0; c < keys.length; c++) {
                    html += `<td style="${s.td}">${renderValue(data[r][keys[c]])}</td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table></div>`;
        }
      } else {
        // Lista semplice (stringhe/numeri)
        html += `<ul style="padding-left:20px;">${data.map(d => `<li>${renderValue(d)}</li>`).join('')}</ul>`;
      }
    } 
    // --- GESTIONE OGGETTO SINGOLO ---
    else if (typeof data === 'object') {
       // Per un oggetto singolo, usiamo una tabella verticale semplice
       // Su mobile togliamo solo i bordi esterni se necessario, ma la struttura regge bene
       var k = Object.keys(data);
       html += `<table style="${s.table}"><tbody>`;
       for(var i=0; i<k.length; i++) {
           html += `<tr><th style="${s.th} width:30%;">${formatHeader(k[i])}</th><td style="${s.td}">${renderValue(data[k[i]])}</td></tr>`;
       }
       html += `</tbody></table>`;
    } else {
       return rawInput;
    }

    html += `</div>`;
    return html;

  } catch (e) {
    return `<div style="color:red; padding:10px; border:1px solid red;">Errore JSON: ${e.message}</div>`;
  }
};
