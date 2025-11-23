window.function = function (jsonInput) {
  // 1. Recupero e Pulizia Input
  // Se l'input è nullo, usiamo stringa vuota
  var rawInput = jsonInput ? jsonInput.value : "";
  
  if (!rawInput) return ""; // Se vuoto, esce subito

  // Pulizia da eventuale markdown (```json ... ```) che a volte le AI lasciano
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // Variabile che conterrà TUTTA la stringa HTML finale
  var finalHtml = "";

  try {
    var data = JSON.parse(rawInput);

    // --- FUNZIONE INTERNA: CONVERTE VALORI IN STRINGA HTML STATICA ---
    // Questa funzione viene eseguita ADESSO. Non finisce nell'HTML.
    // Il suo scopo è trasformare un oggetto complesso in una stringa semplice tipo "<b>Nome:</b> Mario<br>"
    function makeStaticString(val) {
      if (val === null || val === undefined) {
        return "";
      }
      
      // Se il valore è un Oggetto o una Lista, dobbiamo "stamparlo" come testo formattato
      if (typeof val === "object") {
        try {
          // Se è una lista
          if (Array.isArray(val)) {
            var listHtml = '<ul style="margin: 0; padding-left: 15px;">';
            for (var i = 0; i < val.length; i++) {
              // Ricorsione: se nella lista c'è un altro oggetto, lo risolviamo subito
              listHtml += '<li>' + makeStaticString(val[i]) + '</li>';
            }
            listHtml += '</ul>';
            return listHtml;
          } 
          
          // Se è un oggetto singolo (chiave: valore)
          var objKeys = Object.keys(val);
          var objHtml = '<div style="font-size: 0.9em; color: #555;">';
          for (var j = 0; j < objKeys.length; j++) {
            var k = objKeys[j];
            var v = val[k];
            // Creiamo una riga statica "Chiave: Valore"
            objHtml += '<div><strong>' + k + ':</strong> ' + makeStaticString(v) + '</div>';
          }
          objHtml += '</div>';
          return objHtml;

        } catch (e) {
          return JSON.stringify(val); // Fallback in caso di errore
        }
      }
      
      // Se è testo o numero semplice, lo restituiamo così com'è
      return String(val);
    }

    // --- COSTRUZIONE DELLA TABELLA ---
    // Definiamo stili CSS inline (fissi)
    var styleTable = "width:100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; border: 1px solid #ddd;";
    var styleTh = "background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; text-align: left; color: #333;";
    var styleTd = "border: 1px solid #ddd; padding: 10px; vertical-align: top; color: #444;";

    finalHtml += '<div style="overflow-x:auto;">';

    // CASO A: ARRAY DI OGGETTI (Tabella Classica)
    if (Array.isArray(data) && data.length > 0) {
      
      // Troviamo tutte le colonne possibili
      var headers = [];
      // Se il primo elemento è un oggetto, usiamo le sue chiavi come intestazioni
      if (typeof data[0] === 'object' && data[0] !== null) {
        headers = Object.keys(data[0]);
      } else {
        headers = ["Valore"];
      }

      finalHtml += '<table style="' + styleTable + '">';
      
      // Creazione Intestazione (THEAD)
      finalHtml += '<thead><tr>';
      for (var h = 0; h < headers.length; h++) {
        var headerName = headers[h].charAt(0).toUpperCase() + headers[h].slice(1);
        finalHtml += '<th style="' + styleTh + '">' + headerName + '</th>';
      }
      finalHtml += '</tr></thead>';

      // Creazione Corpo (TBODY)
      finalHtml += '<tbody>';
      for (var r = 0; r < data.length; r++) {
        var row = data[r];
        var bg = (r % 2 === 0) ? "#ffffff" : "#f9f9f9"; // Colore alternato righe
        
        finalHtml += '<tr style="background-color: ' + bg + ';">';
        
        // Se è un oggetto complesso, cerchiamo le colonne
        if (typeof row === 'object' && row !== null) {
           for (var c = 0; c < headers.length; c++) {
             var key = headers[c];
             var rawVal = row[key];
             // Qui avviene la magia: trasformiamo il valore in stringa HTML ORA
             var staticContent = makeStaticString(rawVal);
             finalHtml += '<td style="' + styleTd + '">' + staticContent + '</td>';
           }
        } else {
           // Se è una lista semplice ["a", "b"]
           finalHtml += '<td style="' + styleTd + '">' + makeStaticString(row) + '</td>';
        }
        
        finalHtml += '</tr>';
      }
      finalHtml += '</tbody></table>';

    } 
    // CASO B: OGGETTO SINGOLO (Tabella Verticale)
    else if (typeof data === "object" && data !== null) {
      
      finalHtml += '<table style="' + styleTable + '">';
      finalHtml += '<thead><tr><th style="' + styleTh + ' width:30%;">Proprietà</th><th style="' + styleTh + '">Valore</th></tr></thead>';
      finalHtml += '<tbody>';
      
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = data[k];
        var bg = (i % 2 === 0) ? "#ffffff" : "#f9f9f9";
        
        finalHtml += '<tr style="background-color: ' + bg + ';">';
        finalHtml += '<td style="' + styleTd + '"><strong>' + k + '</strong></td>';
        finalHtml += '<td style="' + styleTd + '">' + makeStaticString(v) + '</td>';
        finalHtml += '</tr>';
      }
      finalHtml += '</tbody></table>';

    } else {
      // Caso testo semplice o altro
      return rawInput;
    }

    finalHtml += '</div>';
    return finalHtml;

  } catch (error) {
    // In caso di errore JSON, restituiamo un box rosso statico
    return '<div style="color:red; border:1px solid red; padding:10px;">Errore JSON: ' + error.message + '</div>';
  }
};
