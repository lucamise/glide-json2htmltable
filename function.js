window.function = function (jsonInput, screenSize) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  var sizeVal = screenSize ? screenSize.value : "";
  sizeVal = sizeVal.toLowerCase().trim();

  if (!rawInput) return "";

  // Pulizia input
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // Logica Responsive
  var isMobile = (sizeVal === "small" || sizeVal === "mobile");

  // --- STILI INLINE (Aggiornati per struttura rigida) ---
  var s = {
    // Container
    container: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #333;",
    
    // DESKTOP (Grande tabella unica)
    table: "width:100%; border-collapse: collapse; border: 1px solid #dfe2e5;",
    th: "background-color: #f6f8fa; border: 1px solid #dfe2e5; padding: 12px; font-weight: 600; text-align: left; white-space: nowrap;",
    td: "border: 1px solid #dfe2e5; padding: 10px; vertical-align: top;",
    
    // MOBILE (Card Container)
    card: "border: 1px solid #e1e4e8; border-radius: 8px; margin-bottom: 12px; background: #fff; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);",
    
    // MOBILE (Tabella interna alla Card - GARANTISCE 2 COLONNE)
    cardTable: "width: 100%; border-collapse: collapse;",
    cardTdLabel: "width: 35%; background-color: #f9f9f9; padding: 10px; font-weight: 600; color: #555; border-bottom: 1px solid #eee; vertical-align: top; font-size: 0.9em; text-transform: uppercase;",
    cardTdValue: "padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; color: #333;",
    
    // Utilities
    boolTrue: "color: #2ea043; font-weight: bold;",
    boolFalse: "color: #d73a49; font-weight: bold;",
    nullVal: "color: #ccc; font-style: italic;"
  };

  function formatHeader(key) {
    if (!key) return "";
    var clean = key.replace(/[_-]/g, " ");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  try {
    var data = JSON.parse(rawInput);

    // --- RENDERER DEI VALORI ---
    function renderValue(val) {
      if (val === null || val === undefined) return `<span style="${s.nullVal}">null</span>`;
      if (typeof val === 'boolean') return `<span style="${val ? s.boolTrue : s.boolFalse}">${val}</span>`;
      
      if (typeof val === 'object') {
        if (Array.isArray(val)) {
            if (val.length === 0) return "[]";
            return `<ul style="margin:0; padding-left:15px; text-align:left;">${val.map(v => `<li>${renderValue(v)}</li>`).join('')}</ul>`;
        }
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
        // Troviamo tutte le colonne
        var keys = [];
        for (var i = 0; i < data.length; i++) {
            var rowKeys = Object.keys(data[i]);
            for (var k = 0; k < rowKeys.length; k++) {
                if (keys.indexOf(rowKeys[k]) === -1) keys.push(rowKeys[k]);
            }
        }

        // --- RAMO MOBILE (Cards con Tabella Interna) ---
        if (isMobile) {
            for (var r = 0; r < data.length; r++) {
                html += `<div style="${s.card}">`;
                // Qui creiamo una tabella PER OGNI CARTA per forzare il layout a 2 colonne
                html += `<table style="${s.cardTable}"><tbody>`;
                
                for (var c = 0; c < keys.length; c++) {
                    var key = keys[c];
                    var val = data[r][key];
                    
                    // Riga della carta: Cella SX (Label) | Cella DX (Valore)
                    html += `<tr>`;
                    html += `<td style="${s.cardTdLabel}">${formatHeader(key)}</td>`;
                    html += `<td style="${s.cardTdValue}">${renderValue(val)}</td>`;
                    html += `</tr>`;
                }
                
                html += `</tbody></table>`;
                html += `</div>`;
            }
        } 
        // --- RAMO DESKTOP (Tabella Classica) ---
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
        // Lista semplice
        html += `<ul style="padding-left:20px;">${data.map(d => `<li>${renderValue(d)}</li>`).join('')}</ul>`;
      }
    } 
    // --- GESTIONE OGGETTO SINGOLO ---
    else if (typeof data === 'object') {
       var k = Object.keys(data);
       html += `<table style="${s.table}"><tbody>`;
       for(var i=0; i<k.length; i++) {
           // Tabella verticale fissa
           html += `<tr><th style="${s.th} width:35%;">${formatHeader(k[i])}</th><td style="${s.td}">${renderValue(data[k[i]])}</td></tr>`;
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
