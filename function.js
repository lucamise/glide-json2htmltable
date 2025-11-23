window.function = function (jsonInput) {
  // 1. Recuperiamo il valore
  jsonInput = jsonInput?.value ?? "";

  // 2. Controllo base: se è vuoto, non mostriamo nulla
  if (jsonInput.trim() === "") return "";

  try {
    // 3. Convertiamo il testo in un oggetto JavaScript reale
    let data = JSON.parse(jsonInput);

    // Se il JSON è un singolo oggetto, lo trasformiamo in una lista di un solo elemento
    // per poter usare sempre la stessa logica
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) return "Nessun dato trovato nel JSON.";

    // 4. Prendiamo le chiavi del primo oggetto per fare le intestazioni (Header)
    const headers = Object.keys(data[0]);

    // 5. Iniziamo a costruire la stringa HTML
    // Aggiungo un po' di CSS inline per renderla carina
    let html = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
          <thead>
            <tr style="background-color: #f2f2f2; text-align: left;">
    `;

    // Creiamo le intestazioni (TH)
    headers.forEach(header => {
      // Mettiamo la prima lettera maiuscola per estetica
      const label = header.charAt(0).toUpperCase() + header.slice(1);
      html += `<th style="padding: 10px; border-bottom: 2px solid #ddd; color: #333;">${label}</th>`;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    // 6. Creiamo le righe (TR e TD)
    data.forEach((row, index) => {
      // Alterniamo il colore di sfondo per le righe (bianco / grigio chiaro)
      const bg = index % 2 === 0 ? "transparent" : "#f9f9f9";
      html += `<tr style="background-color: ${bg}; border-bottom: 1px solid #ddd;">`;
      
      headers.forEach(header => {
        let cellValue = row[header];
        
        // Se il valore è un oggetto o array (es. annidato), lo rendiamo leggibile
        if (typeof cellValue === 'object' && cellValue !== null) {
            cellValue = JSON.stringify(cellValue);
        }
        
        html += `<td style="padding: 10px; color: #555;">${cellValue}</td>`;
      });
      
      html += `</tr>`;
    });

    // 7. Chiudiamo la tabella
    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;

  } catch (error) {
    // Se il JSON non è valido, restituiamo un errore leggibile
    return `<div style="color: red; padding: 10px; border: 1px solid red;">Errore JSON: ${error.message}</div>`;
  }
};
