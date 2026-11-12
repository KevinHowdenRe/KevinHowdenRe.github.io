(() => {

    "use strict";


    // =====================================================
    // MOCK DATA
    // =====================================================

    const demoClusters = [

        {
            rank: 1,
            sumSI: 284000000,
            risks: 42,
            newRisks: 3,
            lat: 48.8566,
            lon: 2.3522
        },

        {
            rank: 2,
            sumSI: 197000000,
            risks: 31,
            newRisks: 0,
            lat: 48.8872,
            lon: 2.3180
        },

        {
            rank: 3,
            sumSI: 165000000,
            risks: 18,
            newRisks: 2,
            lat: 48.8352,
            lon: 2.4100
        },

        {
            rank: 4,
            sumSI: 121000000,
            risks: 14,
            newRisks: 1,
            lat: 48.8720,
            lon: 2.4100
        }

    ];


    let map;
    let clusterLayers = [];


    // =====================================================
    // FORMAT
    // =====================================================

    function formatSI(value) {

        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0
        }).format(value);

    }


    // =====================================================
    // MAP
    // =====================================================

    function initMap() {

        map = L.map("map").setView(
            [48.8566, 2.3522],
            12
        );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "© OpenStreetMap contributors"
            }
        ).addTo(map);


        renderClusters();

    }


    function renderClusters() {

        clusterLayers = [];


        demoClusters.forEach((cluster) => {

            const circle = L.circle(
                [cluster.lat, cluster.lon],
                {
                    radius: 1200,
                    color: "#c92a2a",
                    weight: 2,
                    fillColor: "#c92a2a",
                    fillOpacity: 0.05
                }
            );


            circle.bindPopup(`
                <strong>Conflagration #${cluster.rank}</strong>
                <br><br>
                Somme assurée :
                <strong>${formatSI(cluster.sumSI)}</strong>
                <br>
                Risques :
                <strong>${cluster.risks}</strong>
            `);


            circle.addTo(map);


            clusterLayers.push(circle);

        });


        document.querySelector("#mapPointsInfo").textContent =
            "105 risques";

        document.querySelector("#mapClustersInfo").textContent =
            `${demoClusters.length} cercles`;

    }


    // =====================================================
    // TABLE
    // =====================================================

    function renderTable() {

        const tbody =
            document.querySelector("#resultsTableBody");


        tbody.innerHTML = "";


        demoClusters.forEach((cluster, index) => {

            const row = document.createElement("tr");


            row.innerHTML = `
                <td>${cluster.rank}</td>
                <td>${formatSI(cluster.sumSI)}</td>
                <td>${cluster.risks}</td>
                <td>${cluster.newRisks}</td>
                <td>${cluster.lat.toFixed(5)}</td>
                <td>${cluster.lon.toFixed(5)}</td>
            `;


            row.style.cursor = "pointer";


            row.addEventListener(
                "click",
                () => focusCluster(index)
            );


            tbody.appendChild(row);

        });


        document.querySelector("#resultCount").textContent =
            `${demoClusters.length} conflagrations`;

    }


    // =====================================================
    // INTERACTION
    // =====================================================

    function focusCluster(index) {

        const cluster = demoClusters[index];
        const layer = clusterLayers[index];


        if (!cluster) {
            return;
        }


        map.setView(
            [cluster.lat, cluster.lon],
            15,
            {
                animate: true
            }
        );


        if (layer) {
            layer.openPopup();
        }

    }


    // =====================================================
    // DEMO ACTION
    // =====================================================

    function runDemo() {

        const status =
            document.querySelector("#analysisStatus");


        status.textContent =
            `${demoClusters.length} cercles détectés`;

        status.classList.add("badge-success");


        renderTable();

    }
	// =====================================================
	// RESPONSIVE CONFIGURATION
	// =====================================================

	function initResponsiveLayout() {

		const workspace =
			document.querySelector("#conflagWorkspace");

		const button =
			document.querySelector("#btnToggleConfig");


		if (!workspace || !button) {
			return;
		}


		// Mobile / tablet:
		// configuration closed by default

		if (window.innerWidth <= 900) {
			workspace.classList.add("config-collapsed");
		}


		button.addEventListener("click", () => {

			if (window.innerWidth <= 900) {

				workspace.classList.toggle(
					"config-mobile-open"
				);

			} else {

				workspace.classList.toggle(
					"config-collapsed"
				);

			}


			// Leaflet needs to recalculate its dimensions
			setTimeout(() => {

				if (map) {
					map.invalidateSize();
				}

			}, 100);

		});


		window.addEventListener("resize", () => {

			if (map) {
				map.invalidateSize();
			}

		});

	}


    // =====================================================
    // BOOT
    // =====================================================

    function boot() {

    initMap();

    renderTable();

    initResponsiveLayout();


    document
        .querySelector("#btnRun")
        ?.addEventListener(
            "click",
            runDemo
        );

}


	boot();

})();