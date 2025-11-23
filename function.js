window.function = function (jsonInput) {
  // 1. Pulizia Input
  let rawInput = jsonInput?.value ?? "";

  // Rimuoviamo eventuali formattazioni Markdown che le AI mettono spesso (```json ... ```)
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  if (!rawInput) return "";

  try {
    let data = JSON.parse(rawInput);

    // Funzione helper per formattare valori complessi (oggetti dentro celle)
    const formatValue = (val) => {
      if (val === null || val === undefined) return "";
      if (typeof val === "object") {
        // Se è un array o oggetto, lo rendiamo una lista HTML pulita invece di JSON grezzo
        try {
            // Se è una lista semplice
            if (Array.isArray(val)) {
                return `<ul style="margin: 0; padding-left: 20px;">${val.map(v => `<li>${formatValue(v)}</li>`).join('')}</ul>`;
            }
            // Se è un oggetto
            return `<div style="font-size: 0.9em; color: #555;">${Object.entries(val).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br>')}</div>`;
        } catch (e) {
            return JSON.stringify(val);
        }
      }
      return val; // Restituisce testo o numeri così come sono
    };

    // STILI CSS (per rendere tutto leggibile)
    const tableStyle = `width:100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; border: 1px solid #ddd;`;
    const thStyle = `background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: bold; color: #333;`;
    const tdStyle = `border: 1px solid #ddd; padding: 10px; vertical-align: top; color: #444;`;

    let html = `<div style="overflow-x:auto;">`;

    // --- CASO A: È UN ARRAY (Lista di cose) ---
    // Esempio: [{"nome": "A"}, {"nome": "B"}]
    if (Array.isArray(data) && data.length > 0) {
      
      // Raccogliamo TUTTE le chiavi possibili da tutti gli oggetti (non solo dal primo)
      // Questo evita che manchino colonne se il primo oggetto è incompleto
      let allKeys = new Set();
      data.forEach(item => {
          if (typeof item === 'object' && item !== null) {
              Object.keys(item).forEach(k => allKeys.add(k));
          }
      });
      const headers = Array.from(allKeys);

      html += `<table style="${tableStyle}"><thead><tr>`;
      
      // Intestazioni
      if (headers.length > 0) {
          headers.forEach(h => {
            html += `<th style="${thStyle}">${h.charAt(0).toUpperCase() + h.slice(1)}</th>`;
          });
      } else {
          // Caso lista semplice di stringhe ["mela", "pera"]
          html += `<th style="${thStyle}">Valore</th>`;
      }
      
      html += `</tr></thead><tbody>`;

      // Righe
      data.forEach((row, i) => {
        const bg = i % 2 === 0 ? "#fff" : "#f9f9f9";
        html += `<tr style="background-color: ${bg};">`;
        
        if (headers.length > 0) {
            headers.forEach(header => {
              // Qui usiamo formatValue per evitare il "blob" di JSON
              let val = row[header];
              html += `<td style="${tdStyle}">${formatValue(val)}</td>`;
            });
        } else {
             html += `<td style="${tdStyle}">${formatValue(row)}</td>`;
        }
        html += `</tr>`;
      });

      html += `</tbody></table>`;

    } 
    // --- CASO B: È UN OGGETTO SINGOLO (Dettaglio) ---
    // Esempio: {"status": "ok", "data": {...}}
    // Invece di schiacciarlo, facciamo una tabella VERTICALE (Chiave | Valore)
    else if (typeof data === "object" && data !== null) {
      
      html += `<table style="${tableStyle}">
        <thead>
            <tr>
                <th style="${thStyle} width: 30%;">Proprietà</th>
                <th style="${thStyle}">Dettaglio</th>
            </tr>
        </thead>
        <tbody>`;
      
      let i = 0;
      for (const [key, value] of Object.entries(data)) {
        const bg = i % 2 === 0 ? "#fff" : "#f9f9f9";
        html += `<tr style="background-color: ${bg};">
            <td style="${tdStyle}"><strong>${key}</strong></td>
            <td style="${tdStyle}">${formatValue(value)}</td>
        </tr>`;
        i++;
      }

      html += `</tbody></table>`;
    } 
    // --- CASO C: ALTRO ---
    else {
        return rawInput; // Se è solo testo, lo restituiamo così com'è
    }

    html += `</div>`;
    return html;

  } catch (error) {
    return `<div style="color:red; padding:10px; border:1px solid red; background:#fff0f0;">
      <strong>Errore lettura dati:</strong><br>${error.message}
    </div>`;
  }
};
