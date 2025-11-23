window.function = function (jsonInput, unwrapDepth, screenWidth) {
  // 1. Lettura Input
  var rawInput = jsonInput ? jsonInput.value : "";
  var levelsToSkip = unwrapDepth ? parseInt(unwrapDepth.value) : 0;
  if (isNaN(levelsToSkip)) levelsToSkip = 0;

  var widthVal = screenWidth ? Number(screenWidth.value) : 1024;
  var isMobile = !isNaN(widthVal) && widthVal <= 400;

  if (!rawInput) return "";

  // Pulizia
  rawInput = rawInput.replace(/```json/g, "").replace(/```/g, "").trim();

  // --- STILI CSS ---
  var s = {};

  s.table = "width: 100%; border-collapse: collapse; font-family: -apple-system, sans-serif; border: 1px solid #dfe2e5; table-layout: auto;";

  var fontSize, padding;

  if (isMobile) {
      // MOBILE (Super Compact)
      fontSize = "11px";
      padding = "3px 4px"; 
  } else {
      // DESKTOP (Compact)
      fontSize = "13px";
      padding = "5px 8px"; 
  }

  // STILI CELLE
  var cellBase = `padding: ${padding}; border: 1px solid #dfe2e5; font-size: ${fontSize}; vertical-align: top; text-align: left;`;

  s.th = `${cellBase} background-color: #f6f8fa; font-weight: 700; color: #444; white-space: nowrap;`;
  s.td = `${cellBase} background-color: #fff; color: #222; white-space: normal; word-wrap: break-word; min-width: 80px;`;

  s.container = "overflow-x: auto;";
  
  // STILI ACCORDION
  s.summary = "cursor: pointer; outline: none; padding: 2px 0; font-family: sans-serif; font-size: 11px; text-align: left;";
  
  // MODIFICA QUI: Rimosso background, border e padding interno
  // Ora è solo testo in grassetto grigio scuro
  s.summaryLabel = "color: #555; font-weight: 700; margin-left: 2px;";
  
  s.nullVal = "color: #999; font-style: italic;";
  s.bool = "color: #444; font-weight: bold;";

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
                var bg = (r % 2 === 0) ? "#fff" : "#fcfcfc"; 
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
              var thWidth = isMobile ? "width: 35%;" : "width: 30%;";
              contentHtml += `<th style="${s.th} ${thWidth} white-space: normal;">${formatHeader(keys[k])}</th>`;
              contentHtml += `<td style="${s.td}">${buildTable(obj[keys[k]], false)}</td>`;
              contentHtml += '</tr>';
          }
          contentHtml += '</tbody></table>';
      }

      if (isRoot) {
          return contentHtml;
      } else {
          return `
            <details>
                <summary style="${s.summary}">
                   <span style="${s.summaryLabel}">${infoLabel}</span>
                </summary>
                <div style="margin-top: 2px; padding-left: 0;">
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
