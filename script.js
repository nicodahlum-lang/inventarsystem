// === Einstellungen ===
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyaFMA2aedJ4k4Pg5JMrHF2PWa6jtTQDOjVNt8tTDQjSB7TwR--uD4_OuVchH8NYMI12g/exec"; 
const EK = 5.6; // Einkaufspreis
let VK = 15;    // Verkaufspreis
let daten = [];

// === Hilfsfunktionen ===
function zeigeMeldung(nachricht, typ = "info") {
  const meldung = document.getElementById("meldung");
  if (!meldung) return;
  
  meldung.textContent = nachricht;
  meldung.className = `meldung ${typ}`;
  meldung.style.display = "block";
  
  setTimeout(() => {
    meldung.style.display = "none";
  }, 3000);
}

function setzeLadezustand(aktiv) {
  const ladeanzeige = document.getElementById("ladeanzeige");
  const tabelle = document.getElementById("inventarTabelle");
  
  if (ladeanzeige) {
    ladeanzeige.style.display = aktiv ? "block" : "none";
  }
  if (tabelle) {
    tabelle.style.opacity = aktiv ? "0.5" : "1";
  }
}

// === Daten laden ===
async function ladeDaten() {
  setzeLadezustand(true);
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) {
      throw new Error(`HTTP-Fehler: ${res.status}`);
    }
    daten = await res.json();
    aktualisieren();
    zeigeMeldung("Daten erfolgreich geladen", "erfolg");
  } catch (fehler) {
    console.error("Fehler beim Laden:", fehler);
    zeigeMeldung(`Fehler beim Laden: ${fehler.message}`, "fehler");
  } finally {
    setzeLadezustand(false);
  }
}

// === Verkauf ===
async function verkauf(i) {
  const feld = document.getElementById("v_" + i);
  const menge = parseInt(feld.value);
  
  if (!menge || menge <= 0) {
    zeigeMeldung("Bitte geben Sie eine gültige Menge ein", "fehler");
    return;
  }
  
  const d = daten[i];
  
  // Prüfe, ob genug Bestand vorhanden ist
  if (d.Bestand < menge) {
    zeigeMeldung(`Nicht genug Bestand! Verfügbar: ${d.Bestand}`, "fehler");
    feld.focus();
    return;
  }

  const alterBestand = d.Bestand;
  d.Bestand -= menge;
  d.Verkäufe += menge;
  d.Umsatz += menge * VK;
  d.Gewinn += menge * (VK - EK);

  setzeLadezustand(true);
  try {
    const res = await fetch(SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: d.ID,
        bestand: d.Bestand,
        verkaeufe: d.Verkäufe,
        umsatz: d.Umsatz,
        gewinn: d.Gewinn
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP-Fehler: ${res.status}`);
    }

    zeigeMeldung(`${menge}x ${d.Name} verkauft`, "erfolg");
    feld.value = "";
    await ladeDaten();
  } catch (fehler) {
    // Rollback bei Fehler
    d.Bestand = alterBestand;
    d.Verkäufe -= menge;
    d.Umsatz -= menge * VK;
    d.Gewinn -= menge * (VK - EK);
    
    console.error("Fehler beim Verkauf:", fehler);
    zeigeMeldung(`Fehler beim Verkauf: ${fehler.message}`, "fehler");
    setzeLadezustand(false);
  }
}

// === Lieferung ===
async function lieferung(i) {
  const feld = document.getElementById("l_" + i);
  const menge = parseInt(feld.value);
  
  if (!menge || menge <= 0) {
    zeigeMeldung("Bitte geben Sie eine gültige Menge ein", "fehler");
    return;
  }
  
  const d = daten[i];
  const alterBestand = d.Bestand;
  d.Bestand += menge;

  setzeLadezustand(true);
  try {
    const res = await fetch(SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: d.ID,
        bestand: d.Bestand,
        verkaeufe: d.Verkäufe,
        umsatz: d.Umsatz,
        gewinn: d.Gewinn
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP-Fehler: ${res.status}`);
    }

    zeigeMeldung(`${menge}x ${d.Name} geliefert`, "erfolg");
    feld.value = "";
    await ladeDaten();
  } catch (fehler) {
    // Rollback bei Fehler
    d.Bestand = alterBestand;
    
    console.error("Fehler bei Lieferung:", fehler);
    zeigeMeldung(`Fehler bei Lieferung: ${fehler.message}`, "fehler");
    setzeLadezustand(false);
  }
}

// === Tabelle aktualisieren ===
function aktualisieren() {
  const tabelle = document.getElementById("inventarTabelle");
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

    const bestandClass = d.Bestand === 0 ? "bestand-niedrig" : d.Bestand < 10 ? "bestand-warnung" : "";
    
    tabelle.innerHTML += `
      <tr>
        <td>${d.Name}</td>
        <td class="${bestandClass}">${d.Bestand}</td>
        <td>
          <div class="input-gruppe">
            <input type="number" id="v_${i}" min="1" placeholder="0" 
                   aria-label="Verkaufsmenge für ${d.Name}"
                   max="${d.Bestand}"
                   onkeypress="if(event.key==='Enter') verkauf(${i})">
            <button onclick="verkauf(${i})" aria-label="Verkauf bestätigen">OK</button>
          </div>
        </td>
        <td>
          <div class="input-gruppe">
            <input type="number" id="l_${i}" min="1" placeholder="0" 
                   aria-label="Liefermenge für ${d.Name}"
                   onkeypress="if(event.key==='Enter') lieferung(${i})">
            <button onclick="lieferung(${i})" aria-label="Lieferung bestätigen">OK</button>
          </div>
        </td>
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
document.addEventListener("DOMContentLoaded", () => {
  const vkPreisInput = document.getElementById("vkPreis");
  if (vkPreisInput) {
    vkPreisInput.addEventListener("change", e => {
      const neuerPreis = parseFloat(e.target.value);
      if (neuerPreis > 0) {
        VK = neuerPreis;
        zeigeMeldung(`Verkaufspreis auf ${VK.toFixed(2)} € gesetzt`, "erfolg");
      } else {
        zeigeMeldung("Ungültiger Preis", "fehler");
        e.target.value = VK;
      }
    });
  }

  // Aktualisieren-Button
  const aktualisierenBtn = document.getElementById("aktualisierenBtn");
  if (aktualisierenBtn) {
    aktualisierenBtn.addEventListener("click", ladeDaten);
  }

  // Initiales Laden
  ladeDaten();
});
