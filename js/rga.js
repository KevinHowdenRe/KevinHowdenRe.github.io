// ============================================================
// RGA.JS
// Version simple MapLibre + PMTiles
// ============================================================

(() => {
    "use strict";
	const year = 2026;
    // ========================================================
    // CONFIG
    // ========================================================
	
    const DATA_PATH = "/data/rga";

	const ALEA_RGA_URL =
		`${DATA_PATH}/alea_rga.pmtiles`;

	function getCommunesUrl(year) {
		return `${DATA_PATH}/communes_${year}.pmtiles`;
	}

	function getCommunesOverviewUrl(year) {
		return `${DATA_PATH}/communes_${year}_overview.pmtiles`;
	}


    // ========================================================
    // COULEURS
    // ========================================================

    // Résultats communaux
    const COMMUNE_COLORS = {
        CAS1: "#68191d",
        CAS2: "#d9535a",
        CAS3: "#f2a900",
        NON:  "#f5f5df"
    };

    // Aléa BRGM
    const RGA_COLORS = {
        1: "#f1e68d",
        2: "#d3691f",
        3: "#a42b2a"
    };


    // ========================================================
    // PMTILES
    // ========================================================

    const protocol = new pmtiles.Protocol();

    maplibregl.addProtocol(
        "pmtiles",
        protocol.tile
    );


    // ========================================================
    // MAP
    // ========================================================

    const map = new maplibregl.Map({
        container: "map",

        center: [2.3, 46.6],
        zoom: 5.5,

        minZoom: 4,
        maxZoom: 18,

        style: {
            version: 8,

            sources: {
                osm: {
                    type: "raster",

                    tiles: [
                        "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    ],

                    tileSize: 256,

                    attribution:
                        "© OpenStreetMap contributors"
                }
            },

            layers: [
                {
                    id: "osm",
                    type: "raster",
                    source: "osm"
                }
            ]
        }
    });


    map.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
    );


    // ========================================================
    // CHARGEMENT DES COUCHES
    // ========================================================

    map.on("load", () => {

        addRgaLayer();
        addCommunesLayer(year);

        bindInterface();

        console.log("Carte RGA chargée");
    });


    // ========================================================
    // RGA BRGM
    // ========================================================

    function addRgaLayer() {

		map.addSource("alea-rga", {
			type: "raster",
			url: `pmtiles://${ALEA_RGA_URL}`,
			tileSize: 512
		});

		map.addLayer({
			id: "alea-rga",
			type: "raster",
			source: "alea-rga",

			paint: {
				"raster-opacity": 0.75
			}
		});
	}

    // ========================================================
    // COMMUNES
    // ========================================================

    function addCommunesLayer(year) {

    // ========================================================
    // 1. OVERVIEW RASTER
    // Vue France entière - zoom faible
    // ========================================================

    map.addSource("communes-overview", {
        type: "raster",
        url: `pmtiles://${getCommunesOverviewUrl(year)}`,
        tileSize: 512
    });

    map.addLayer({
        id: "communes-overview",
        type: "raster",
        source: "communes-overview",

        // Petit chevauchement avec la couche vectorielle
        maxzoom: 8.5,

        paint: {
            "raster-opacity": 0.65
        }
    });


    // ========================================================
    // 2. COMMUNES VECTORIELLES
    // Détail + interaction - zoom >= 8
    // ========================================================

    map.addSource("communes", {
        type: "vector",
        url: `pmtiles://${getCommunesUrl(year)}`
    });


    // --------------------------------------------------------
    // Remplissage
    // --------------------------------------------------------

    map.addLayer({
        id: "communes-fill",

        type: "fill",

        source: "communes",

        "source-layer": "communes",

        minzoom: 8,

        paint: {

            "fill-color": [
                "match",
                ["get", "raison_rga"],

                "CAS1", COMMUNE_COLORS.CAS1,
                "CAS2", COMMUNE_COLORS.CAS2,
                "CAS3", COMMUNE_COLORS.CAS3,
                "NON",  COMMUNE_COLORS.NON,

                "rgba(0,0,0,0)"
            ],

            "fill-opacity": 0.65
        }
    });


    // --------------------------------------------------------
    // Contours
    // --------------------------------------------------------

    map.addLayer({
        id: "communes-outline",

        type: "line",

        source: "communes",

        "source-layer": "communes",

        minzoom: 8,

        paint: {

            "line-color": "#555",

            "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],

                8, 0.2,
                10, 0.5,
                12, 0.8
            ],

            "line-opacity": 0.7
        }
    });


    // --------------------------------------------------------
    // Surbrillance commune sélectionnée
    // --------------------------------------------------------

    map.addLayer({
        id: "commune-selected",

        type: "line",

        source: "communes",

        "source-layer": "communes",

        minzoom: 8,

        filter: [
            "==",
            ["get", "code_insee"],
            "__NONE__"
        ],

        paint: {
            "line-color": "#000000",
            "line-width": 3
        }
    });
}


    // ========================================================
    // CLIC COMMUNE
    // ========================================================

    map.on("click", "communes-fill", (event) => {

        const feature = event.features?.[0];

        if (!feature) {
            return;
        }

        const p = feature.properties;

        console.log(
            "Commune sélectionnée :",
            p
        );


        // ----------------------------------------------------
        // Highlight
        // ----------------------------------------------------

        map.setFilter(
            "commune-selected",
            [
                "==",
                ["get", "code_insee"],
                String(p.code_insee)
            ]
        );


        // ----------------------------------------------------
        // Interface actuelle
        // ----------------------------------------------------

        setText(
            "detailCommune",
            p.nom_officiel || "—"
        );

        setText(
            "detailInsee",
            p.code_insee || "—"
        );

        setText(
            "detailIndicator",
            p.indicateur ?? "—"
        );

        setText(
            "detailRga",
            p.raison_rga || "—"
        );
    });


    // Curseur pointer

    map.on(
        "mouseenter",
        "communes-fill",
        () => {
            map.getCanvas().style.cursor =
                "pointer";
        }
    );


    map.on(
        "mouseleave",
        "communes-fill",
        () => {
            map.getCanvas().style.cursor =
                "";
        }
    );


    // ========================================================
    // INTERFACE
    // ========================================================

    function bindInterface() {

        // ----------------------------------------------------
        // Communes
        // ----------------------------------------------------

        const layerCommunes =
            document.getElementById(
                "layerCommunes"
            );

        if (layerCommunes) {

            layerCommunes.addEventListener(
                "change",
                () => {

                    const visibility =
                        layerCommunes.checked
                            ? "visible"
                            : "none";

                    setLayerVisibility(
                        "communes-fill",
                        visibility
                    );

                    setLayerVisibility(
                        "communes-outline",
                        visibility
                    );
					setLayerVisibility(
						"communes-overview",
						visibility
					);

                    setLayerVisibility(
                        "commune-selected",
                        visibility
                    );
                }
            );
        }


        // ----------------------------------------------------
        // RGA
        // ----------------------------------------------------

        const layerRga =
            document.getElementById(
                "layerRga"
            );

        if (layerRga) {

            layerRga.addEventListener(
                "change",
                () => {

                    const visibility =
                        layerRga.checked
                            ? "visible"
                            : "none";

					setLayerVisibility(
						"alea-rga",
						visibility
					);
                }
            );
        }


        // ----------------------------------------------------
        // SWI
        // PLACEHOLDER
        // ----------------------------------------------------

        const layerSwi =
            document.getElementById(
                "layerSwi"
            );

        if (layerSwi) {

            layerSwi.addEventListener(
                "change",
                () => {

                    console.log(
                        "SWI : placeholder"
                    );
                }
            );
        }


        // ----------------------------------------------------
        // Recherche
        // PLACEHOLDER pour l'instant
        // ----------------------------------------------------

        const searchInput =
            document.getElementById(
                "mapSearchInput"
            );

        if (searchInput) {

            searchInput.addEventListener(
                "keydown",
                event => {

                    if (event.key !== "Enter") {
                        return;
                    }

                    console.log(
                        "Recherche :",
                        searchInput.value
                    );
                }
            );
        }
    }


    // ========================================================
    // HELPERS
    // ========================================================

    function setLayerVisibility(
        layerId,
        visibility
    ) {

        if (!map.getLayer(layerId)) {
            return;
        }

        map.setLayoutProperty(
            layerId,
            "visibility",
            visibility
        );
    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            value ?? "—";
    }


    // ========================================================
    // PLACEHOLDERS
    // ========================================================

    function loadPortfolio() {
        console.log(
            "Portfolio : placeholder"
        );
    }


    function resetPortfolio() {
        console.log(
            "Reset : placeholder"
        );
    }


    function exportResults() {
        console.log(
            "Export : placeholder"
        );
    }

})();