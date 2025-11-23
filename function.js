window.function = function (jsonInput, screenWidth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  // Se non viene passato width, assumiamo desktop (1024) per sicurezza
  var width = screenWidth ? Number(screenWidth.value) : 1024;
  
  if (!rawInput) return "";

  // Pulizia
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // DEFINIZIONE: Quando consideriamo che è "Mobile"?
  var isMobile = width < 600;

  // --- STILI INLINE (Sicuri al 100%) ---
  var s = {
    // Stili Generali
    container: "font-family: -apple-system, sans-serif; font-size: 14px; color: #333;",
    
    // Stili Desktop (Tabella)
    table: "width:100%; border-collapse: collapse; border: 1px solid #dfe2e5;",
    th: "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px; font-weight: 600; text-align: left;",
    td: "border: 1px solid #dfe2e5; padding: 10px; vertical-align: top;",
    
    // Stili Mobile (Cards)
    card: "border: 1px solid #e1e4e8; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05);",
    cardRow: "display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding: 8px 0;",
    cardLabel: "font-weight: 600; color: #666; font-size: 0.9em; margin-right: 10px;",
    cardVal: "text-align: right; word-break: break-word;",
    
    // Utilities
    boolTrue: "color: #2ea043; font-weight: bold;",
    boolFalse: "color: #d73a49; font-weight: bold;",
    nullVal: "color: #ccc; font-style: italic;"
  };

  // Funzione per formattare le intestazioni (es. user_id -> User id)
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
        // Se è un oggetto/array annidato, lo mostriamo come lista semplice o JSON stringify per non rompere il layout
        if (Array.isArray(val)) {
            if (val.length === 0) return "[]";
            // Piccola lista puntata per gli array annidati
            return `<ul style="margin:0; padding-left:15px; text-align:left;">${val.map(v => `<li>${renderValue(v)}</li>`).join('')}</ul>`;
        }
        // Se è un oggetto
        return Object.keys(val).map(k => `<div><strong>${k}:</strong> ${renderValue(val[k])}</div>`).join('');
      }
      return String(val);
    }

    // --- COSTRUZIONE OUTPUT ---
    var html = `<div style="${s.container}">`;

    if (Array.isArray(data)) {
      if (data.length === 0) return "";
      
      var isListOfObjects = typeof data[0] === 'object' && data[0] !== null;

      if (isListOfObjects) {
        // Troviamo tutte le colonne
        var keys = [];
        for (var i = 0; i < data.length; i++) {
            var rowKeys = Object.keys(data[i]);
            for (var k = 0; k < rowKeys.length; k++) {
                if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
            }
        }

        // --- RAMO A: VISUALIZZAZIONE MOBILE (CARDS) ---
        if (isMobile) {
            for (var r = 0; r < data.length; r++) {
                html += `<div style="${s.card}">`;
                for (var c = 0; c < keys.length; c++) {
                    var key = keys[c];
                    var val = data[r][key];
                    // Ogni riga della card è: Label a sinistra, Valore a destra
                    html += `<div style="${s.cardRow}">`;
                    html += `<div style="${s.cardLabel}">${formatHeader(key)}</div>`;
                    html += `<div style="${s.cardVal}">${renderValue(val)}</div>`;
                    html += `</div>`;
                }
                html += `</div>`;
            }
        } 
        // --- RAMO B: VISUALIZZAZIONE DESKTOP (TABELLA) ---
        else {
            html += `<div style="overflow-x:auto;"><table style="${s.table}"><thead><tr>`;
            for (var h = 0; h < keys.length; h++) {
                html += `<th style="${s.th}">${formatHeader(keys[h])}</th>`;
            }
            html += `</tr></thead><tbody>`;
            
            for (var r = 0; r < data.length; r++) {
                var bg = (r % 2 === 0) ? "#fff" : "#f9f9f9";
                html += `<tr style="background-color:${bg}">`;
                for (var c = 0; c < keys.length; c++) {
                    html += `<td style="${s.td}">${renderValue(data[r][keys[c]])}</td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table></div>`;
        }

      } else {
        // Lista semplice (non oggetti)
        html += `<ul style="padding-left:20px;">${data.map(d => `<li>${renderValue(d)}</li>`).join('')}</ul>`;
      }
    } 
    // CASO OGGETTO SINGOLO (Dettaglio)
    else if (typeof data === 'object') {
       // Anche qui usiamo logica Mobile vs Desktop? 
       // Per un oggetto singolo, una tabella verticale va bene per entrambi, 
       // ma su mobile possiamo togliere i bordi della tabella.
       var k = Object.keys(data);
       html += `<table style="${s.table}"><tbody>`;
       for(var i=0; i<k.length; i++) {
           html += `<tr><th style="${s.th} width:30%;">${formatHeader(k[i])}</th><td style="${s.td}">${renderValue(data[k[i]])}</td></tr>`;
       }
       html += `</tbody></table>`;
    }

    html += `</div>`;
    return html;

  } catch (e) {
    return `<div style="color:red; padding:10px; border:1px solid red;">Errore JSON: ${e.message}</div>`;
  }
};
