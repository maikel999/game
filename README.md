# ⚔️ Top-Down Game Experiment (JavaScript/Canvas)

Dit project is een experimenteel 2D top-down spel gebouwd met pure **JavaScript** en **HTML Canvas**. Het doel is om te leren over game-architectuur, asset-management en interactie op mobiele apparaten.

---

## 🚀 Speel het Spel & Bewerk de Map

| Link | Beschrijving |
| :--- | :--- |
| **🎮 Speel de Game** | [Game Link](https://maikel999.github.io/game/) |
| **🗺️ Map Editor** | [Map Editor Link](https://maikel999.github.io/game/map_editor/map_editor.html) |

---

## ✨ Huidige Functies

Ondanks dat het een experiment is, heeft het spel de volgende werkende functies:

* **Mobiele Besturing:** Volledig functionele, responsive **Joystick** UI voor mobiel en desktop.
* **Camera Tracking:** De camera volgt de speler vloeiend door de grotere wereld.
* **Asset Management:** Laden van speler spritesheets en omgevings-tilesets.
* **Spritesheet Animatie:** Geanimeerde speler-karakter (Walk, Run, Idle) met 4 richtingen.
* **Custom Map Editor:** Een op zichzelf staande HTML-pagina om visueel maps te creëren en op te slaan als JSON-data.
* **Botsingsdetectie (Collision):** Spelers kunnen niet door muren lopen.
* **Modulaire Map Data:** Map-objecten (muren, spawnpunten, etc.) worden geladen vanuit een extern `map_data.json` bestand.

---

## 🛠️ Gebruikte Technologieën

* **Frontend:** HTML5, Pure JavaScript (ES6+), HTML Canvas API
* **Assets:** RPG Maker-stijl spritesheets voor animatie en custom tilesets.
* **Workflow:** GitHub Pages voor hosting en de basis voor een flexibele, op JSON-gebaseerde map-structuur.

---

## 🗺️ Objecten in de Map Editor

De editor gebruikt de volgende objecttypes:

| Type | Doel | Collision | Bestandsnaam (voorbeeld) |
| :--- | :--- | :--- | :--- |
| `background` | De basis vloer om de wereld te vullen. | Nee | `tile_grass.png` |
| `wall_h` / `wall_v`| Horizontale/Verticale obstakels. | Ja | `Wooden_Fence_Horizontal.png` |
| `tree_*` | Decoratieve elementen (Small, Medium, Large). | Nee (Tenzij later toegevoegd) | `Tree_Large.png` |
| `spawn` | De startpositie van de speler. | Ja (Wordt niet getekend, maar definieert de start) | `tile_spawn.png` |

---

## ⚙️ Lokale Ontwikkeling

Om dit project lokaal uit te voeren en te bewerken:

1.  **Kloon de Repository:**
    ```bash
    git clone [https://github.com/maikel999/game.git](https://github.com/maikel999/game.git)
    ```
2.  **Start een Lokale Server:** Vanwege CORS-beperkingen is het nodig om een lokale HTTP-server te gebruiken. Gebruik bijvoorbeeld de "Live Server" extensie in VS Code of de Python Simple HTTP Server.
3.  **Map Editor:** Gebruik `map_editor/map_editor.html` om wijzigingen aan te brengen, download de nieuwe `map_data.json` en plaats deze in de map `/maps`.
<a href="https://maikel999.github.io/game/">Game</a>

<a href="https://maikel999.github.io/game/map_editor/map_editor.html">map editor</a>

