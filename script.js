// === Einstellungen ===
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxBXQdYa0D1pmDSa0IQBFZiTINmNb64NlV3IC9UHuCzDpQ7hvN5M3vVJ0jbUQyjLLtiWw/exechttps://script.google.com/macros/s/AKfycbzY1ySdkWGZ0M-0MHC9aDRxcDTxmHq72vNjlGpSr_YpBjBQT0LN8gfttHxz3KTqBlGV/exec"; 
const EK = 5.6; // Einkaufspreis
let VK = 15;    // Verkaufspreis
let daten = [];

// === Daten laden ===
async function ladeDaten() {
  const res = await fetch(SHEET_URL);
  daten = await res.json();
  aktualisieren();
}

// === Verkauf ===
async function verkauf(i) {
  const feld = document.getElementById("v_" + i);
  const menge = parseInt(feld.value);
  if (!menge || menge <= 0) return;
  const d = daten[i];

  d.Bestand -= menge;
  d.Verkäufe += menge;
  d.Umsatz += menge * VK;
  d.Gewinn += menge * (VK - EK);

  await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      id: d.ID,
      bestand: d.Bestand,
      verkaeufe: d.Verkäufe,
      umsatz: d.Umsatz,
      gewinn: d.Gewinn
    })
  });

  feld.value = "";
  ladeDaten();
}

// === Lieferung ===
async function lieferung(i) {
  const feld = document.getElementById("l_" + i);
  const menge = parseInt(feld.value);
  if (!menge || menge <= 0) return;
  const d = daten[i];

  d.Bestand += menge;

  await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      id: d.ID,
      bestand: d.Bestand,
      verkaeufe: d.Verkäufe,
      umsatz: d.Umsatz,
      gewinn: d.Gewinn
    })
  });

  feld.value = "";
  ladeDaten();
}

// === Tabelle aktualisieren ===
function aktualisieren() {
  const tabelle = document.getElementById("Sheet1");
  tabelle.innerHTML = `
    <tr>
      <th>Sorte</th>
      <th>Bestand</th>
      <th>Verkauf (+)</th>
      <th>Lieferung (+)</th>
      <th>Verkäufe</th>
      <th>Umsatz (€)</th>
      <th>Gewinn (€)</th>
    </tr>`;

  let gesamtB = 0, gesamtU = 0, gesamtG = 0;

  daten.forEach((d, i) => {
    gesamtB += d.Bestand;
    gesamtU += d.Umsatz;
    gesamtG += d.Gewinn;

    tabelle.innerHTML += `
      <tr>
        <td>${d.Name}</td>
        <td>${d.Bestand}</td>
        <td><input type="number" id="v_${i}" min="1" placeholder="0"><button onclick="verkauf(${i})">OK</button></td>
        <td><input type="number" id="l_${i}" min="1" placeholder="0"><button onclick="lieferung(${i})">OK</button></td>
        <td>${d.Verkäufe}</td>
        <td>${d.Umsatz.toFixed(2)}</td>
        <td>${d.Gewinn.toFixed(2)}</td>
      </tr>`;
  });

  document.getElementById("gesamtBestand").textContent = gesamtB;
  document.getElementById("gesamtUmsatz").textContent = gesamtU.toFixed(2);
  document.getElementById("gesamtGewinn").textContent = gesamtG.toFixed(2);
}

// === Verkaufspreis ändern ===
document.getElementById("vkPreis").addEventListener("change", e => {
  VK = parseFloat(e.target.value);
});

ladeDaten();
// === Notizbereich ===
const notes = document.getElementById('notes');
const saveBtn = document.getElementById('saveNotes');
const clearBtn = document.getElementById('clearNotes');

// Beim Laden: gespeicherte Notiz anzeigen
document.addEventListener('DOMContentLoaded', () => {
  const savedNote = localStorage.getItem('inventar_notes');
  if (savedNote) notes.value = savedNote;
});

// Speichern-Button
saveBtn.addEventListener('click', () => {
  localStorage.setItem('inventar_notes', notes.value);
  alert('📝 Notiz gespeichert!');
});

// Löschen-Button
clearBtn.addEventListener('click', () => {
  if (confirm('Willst du wirklich alle Notizen löschen?')) {
    localStorage.removeItem('inventar_notes');
    notes.value = '';
  }
});


