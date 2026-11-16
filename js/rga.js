/* =========================================================
   RGA.JS
   Prototype - carte RGA / SWI / CatNat

   Pour le moment :
   - Initialisation Leaflet
   - Fond de carte
   - Couches WMS
   - Recherche géographique via geocoder.js
   - Placeholders pour les futures fonctionnalités
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const MAP_CONFIG = {

    center: [46.60, 2.50],
    zoom: 6,

    minZoom: 5,
    maxZoom: 18

};


/* =========================================================
   WMS SERVICES
   ========================================================= */

const WMS = {

    // IGN / Géoplateforme
    ignVector:
        "https://data.geopf.fr/wms-v/wms?",

    ignRaster:
        "https://data.geopf.fr/wms-r/wms?",


    // -----------------------------------------------------
    // TODO
    // Ajouter ici le service WMS RGA lorsqu'il est validé.
    // -----------------------------------------------------

    rga:
        null,


    // -----------------------------------------------------
    // TODO
    // Futur service contenant les mailles / résultats SWI.
    // -----------------------------------------------------

    swi:
        null

};


/* =========================================================
   MAP
   ========================================================= */

let map = null;


/* =========================================================
   LAYERS
   ========================================================= */

let communeLayer = null;

let departmentLayer = null;

let rgaLayer = null;

let swiLayer = null;


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let selectedCommune = null;

let portfolioData = null;


/* =========================================================
   INIT MAP
   ========================================================= */

function initMap() {

    map = L.map("map", {

        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,

        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom

    });


    /* -----------------------------------------------------
       BASE MAP

       On garde OpenStreetMap comme dans Conflagration.
       ----------------------------------------------------- */

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(map);


    /* -----------------------------------------------------
       WMS LAYERS
       ----------------------------------------------------- */

    initWmsLayers();


    /* -----------------------------------------------------
       MAP EVENTS
       ----------------------------------------------------- */

    initMapEvents();

}


/* =========================================================
   WMS LAYERS
   ========================================================= */

function initWmsLayers() {


    /* -----------------------------------------------------
       COMMUNES

       TODO:
       confirmer le nom exact de couche WMS Géoplateforme
       avant activation.

       Structure déjà prête.
       ----------------------------------------------------- */

    /*
    communeLayer = L.tileLayer.wms(
        WMS.ignVector,
        {

            layers:
                "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune",

            format:
                "image/png",

            transparent:
                true,

            opacity:
                0.7

        }
    );

    communeLayer.addTo(map);
    */


    /* -----------------------------------------------------
       DEPARTEMENTS

       Même principe.
       ----------------------------------------------------- */

    /*
    departmentLayer = L.tileLayer.wms(
        WMS.ignVector,
        {

            layers:
                "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement",

            format:
                "image/png",

            transparent:
                true,

            opacity:
                0.8

        }
    );

    departmentLayer.addTo(map);
    */


    /* -----------------------------------------------------
       RGA
       -----------------------------------------------------

       Le branchement Leaflet est déjà prévu.

       Une fois l'URL + le nom de couche WMS confirmés :

       WMS.rga = "...";

       puis décommenter ce bloc.
       ----------------------------------------------------- */

    /*
    rgaLayer = L.tileLayer.wms(
        WMS.rga,
        {

            layers:
                "RGA_LAYER_NAME",

            format:
                "image/png",

            transparent:
                true,

            opacity:
                0.65

        }
    );

    rgaLayer.addTo(map);
    */


    /* -----------------------------------------------------
       SWI

       Future couche issue de nos calculs.
       ----------------------------------------------------- */

    /*
    swiLayer = L.tileLayer.wms(
        WMS.swi,
        {

            layers:
                "SWI",

            format:
                "image/png",

            transparent:
                true,

            opacity:
                0.65

        }
    );
    */

}


/* =========================================================
   MAP EVENTS
   ========================================================= */

function initMapEvents() {

    map.on(
        "click",
        handleMapClick
    );

}


/* =========================================================
   MAP CLICK
   ========================================================= */

function handleMapClick(e) {

    const latitude =
        e.latlng.lat;

    const longitude =
        e.latlng.lng;


    console.log(
        "Map click:",
        latitude,
        longitude
    );


    /* -----------------------------------------------------
       PLACEHOLDER

       Plus tard :

       1. identifier la commune correspondant au point
       2. récupérer son code INSEE
       3. charger les informations RGA
       4. charger SWI
       5. charger CatNat
       6. afficher les informations

       Pour l'instant on affiche simplement le point cliqué.
       ----------------------------------------------------- */

    showPlaceholderCommune(
        latitude,
        longitude
    );

}


/* =========================================================
   PLACEHOLDER COMMUNE
   ========================================================= */

function showPlaceholderCommune(
    latitude,
    longitude
) {

    selectedCommune = {

        latitude:
            latitude,

        longitude:
            longitude

    };


    setText(
        "detailCommune",
        "Commune sélectionnée"
    );


    setText(
        "detailLocation",
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    );


    setText(
        "detailInsee",
        "—"
    );


    setText(
        "detailDepartment",
        "—"
    );


    setText(
        "detailRga",
        "—"
    );


    setText(
        "detailSwi",
        "—"
    );


    setText(
        "detailSwiRank",
        "—"
    );


    setText(
        "detailCatnat",
        "—"
    );


    enableExport();

}


/* =========================================================
   LAYER CONTROLS
   ========================================================= */

function initLayerControls() {

    bindLayerToggle(
        "layerCommunes",
        () => communeLayer
    );


    bindLayerToggle(
        "layerDepartments",
        () => departmentLayer
    );


    bindLayerToggle(
        "layerRga",
        () => rgaLayer
    );


    bindLayerToggle(
        "layerSwi",
        () => swiLayer
    );

}


/* =========================================================
   GENERIC LAYER TOGGLE
   ========================================================= */

function bindLayerToggle(
    elementId,
    getLayer
) {

    const checkbox =
        document.getElementById(elementId);


    if (!checkbox) {

        return;

    }


    checkbox.addEventListener(
        "change",
        () => {

            const layer =
                getLayer();


            /* Layer not implemented yet */

            if (!layer) {

                return;

            }


            if (checkbox.checked) {

                layer.addTo(map);

            }

            else {

                map.removeLayer(layer);

            }

        }
    );

}


/* =========================================================
   GEOCODER
   ========================================================= */

function initMapSearch() {

    const input =
        document.getElementById(
            "mapSearch"
        );


    const button =
        document.getElementById(
            "btnMapSearch"
        );


    if (
        !input ||
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            runMapSearch(
                input.value
            );

        }
    );


    input.addEventListener(
        "keydown",
        e => {

            if (
                e.key === "Enter"
            ) {

                e.preventDefault();

                runMapSearch(
                    input.value
                );

            }

        }
    );

}


/* =========================================================
   RUN MAP SEARCH
   ========================================================= */

async function runMapSearch(query) {

    query =
        query.trim();


    if (!query) {

        return;

    }


    /* -----------------------------------------------------

       PLACEHOLDER CONNECTION TO geocoder.js

       Ici on branchera EXACTEMENT la même fonction que dans
       Conflagration.

       Exemple :

       const result =
           await geocode(query);

       map.setView(
           [
               result.latitude,
               result.longitude
           ],
           14
       );

       ----------------------------------------------------- */


    console.log(
        "Geocoder search:",
        query
    );

}


/* =========================================================
   PORTFOLIO
   ========================================================= */

function initPortfolioImport() {

    const input =
        document.getElementById(
            "portfolio-file"
        );


    if (!input) {

        return;

    }


    input.addEventListener(
        "change",
        handlePortfolioFile
    );

}


/* =========================================================
   PORTFOLIO PLACEHOLDER
   ========================================================= */

function handlePortfolioFile(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    /* -----------------------------------------------------

       TODO

       Ici on branchera fileLoader.js.

       Le fichier devra ensuite être rattaché aux communes
       par code INSEE.

       ----------------------------------------------------- */


    portfolioData = null;


    setText(
        "fileStatus",
        file.name
    );


    setText(
        "portfolioMode",
        "Mode portefeuille"
    );


    console.log(
        "Portfolio:",
        file
    );

}


/* =========================================================
   YEAR
   ========================================================= */

function initYearSelector() {

    const select =
        document.getElementById(
            "analysisYear"
        );


    if (!select) {

        return;

    }


    select.addEventListener(
        "change",
        () => {

            setText(
                "selectedYear",
                select.value
            );


            /* TODO:
               actualiser couche SWI
               + informations commune
            */

        }
    );

}


/* =========================================================
   EXPORT
   ========================================================= */

function enableExport() {

    const button =
        document.getElementById(
            "btnExportResults"
        );


    if (button) {

        button.disabled =
            false;

    }

}


/* =========================================================
   RESET
   ========================================================= */

function initReset() {

    const button =
        document.getElementById(
            "btnReset"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        fullReset
    );

}


/* =========================================================
   FULL RESET
   ========================================================= */

function fullReset() {

    selectedCommune =
        null;


    portfolioData =
        null;


    map.setView(
        MAP_CONFIG.center,
        MAP_CONFIG.zoom
    );


    setText(
        "detailCommune",
        "Aucune commune sélectionnée"
    );


    setText(
        "detailLocation",
        "Recherchez une adresse puis cliquez sur une commune."
    );


    setText(
        "detailInsee",
        "—"
    );


    setText(
        "detailDepartment",
        "—"
    );


    setText(
        "detailRga",
        "—"
    );


    setText(
        "detailSwi",
        "—"
    );


    setText(
        "detailSwiRank",
        "—"
    );


    setText(
        "detailCatnat",
        "—"
    );


    setText(
        "fileStatus",
        "Aucun portefeuille chargé"
    );


    setText(
        "portfolioMode",
        "Données générales"
    );


    const portfolioInput =
        document.getElementById(
            "portfolio-file"
        );


    if (portfolioInput) {

        portfolioInput.value =
            "";

    }


    const portfolioDetails =
        document.getElementById(
            "portfolioDetails"
        );


    if (portfolioDetails) {

        portfolioDetails.hidden =
            true;

    }


    const exportButton =
        document.getElementById(
            "btnExportResults"
        );


    if (exportButton) {

        exportButton.disabled =
            true;

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   INITIALIZE APPLICATION
   ========================================================= */

function initRgaApp() {

    initMap();

    initLayerControls();

    initMapSearch();

    initPortfolioImport();

    initYearSelector();

    initReset();

}


/* =========================================================
   START
   ========================================================= */

initRgaApp();