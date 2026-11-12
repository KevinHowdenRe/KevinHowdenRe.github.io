(() => {

    "use strict";
	
	// =====================================================
	// APPLICATION STATE
	// =====================================================

	const STATE = {

		data: {

			initial: [],

			results: {

				clusters: [],

				pointsInClusters: []

			}

		},


		selected: {

			data: [],

			results: {

				clusters: [],

				pointsInClusters: []

			}

		},


		selection: {

			active: false,

			geometry: null,

			policyIds: []

		},




		analysis: {

			parameters: null,

			lastRunAt: null

		}

	};
	
	// =====================================================
	// DATA SCHEMA
	// =====================================================

	const DATA_SCHEMA = {

		requiredColumns: [
			"id_policy",
			"Latitude",
			"Longitude",
			"SI"
		],

		optionalColumns: [
			"Localisation"
		]

	};

	// =====================================================
	// DATA LOADING
	// =====================================================

	async function handleFileLoad(event) {

		const file =
			event.target.files?.[0];


		if (!file) {
			return;
		}


		const status =
			document.querySelector("#fileStatus");


		try {

			status.textContent =
				"Chargement...";

			console.log("here");
			const loaded =
				await FileLoader.load(
					file,
					DATA_SCHEMA
				);

			console.log(loaded);
			setInitialData(
				loaded.data,
			);


			status.textContent =
				`${loaded.fileName} — ${loaded.data.length.toLocaleString("fr-FR")} lignes`;



		}
		catch (error) {
			status.textContent =
				error.message;


			event.target.value = "";

		}

	}
	function fullReset(){
		
		// A new portfolio invalidates previous results.

		resetResults();
		renderTable();

		// Reset geographic selection.

		STATE.selection.active =
			false;


		STATE.selection.geometry =
			null;


		STATE.selection.policyIds =
			[];



		// Reset analysis metadata.

		STATE.analysis.parameters =
			null;


		STATE.analysis.lastRunAt =
			null;


		updateAnalysisStatus(
			"Données réinitialisées"
		);

	}
	
	function setInitialData(data) {

		STATE.data.initial =
			data;


		// No geographic selection:
		// the selected portfolio is the complete portfolio.

		STATE.selected.data =
			data.slice();


		fullReset();

		updateAnalysisStatus(
			`${data.length.toLocaleString("fr-FR")} polices chargées`
		);

	}
	
	function createEmptyResults() {

		return {

			clusters: [],

			pointsInClusters: [],

			metadata: {

				rawClustersCount: 0,

				retainedClustersCount: 0,

				removedOverlappingPoints: 0

			}

		};

	}


	function resetResults() {

		STATE.data.results =
			createEmptyResults();


		STATE.selected.results =
			createEmptyResults();

	}
	
	// =====================================================
	// ANALYSIS PARAMETERS
	// =====================================================

	function getAnalysisParameters() {

		const radius =
			Number(
				document.querySelector("#radius")?.value
			);


		const threshold =
			Number(
				1000000*document.querySelector("#minSI")?.value
			);


		const gridStep =
			Number(
				document.querySelector("#gridStep")?.value
			);


		const zoneSize =
			Number(
				document.querySelector("#zoneSize")?.value
			);
			
		const maxClusters =
			Number(
				document.querySelector("#maxClusters")?.value
			);


		if (!Number.isFinite(radius) || radius <= 0) {

			throw new Error(
				"Le rayon doit être supérieur à zéro."
			);

		}


		if (!Number.isFinite(threshold) || threshold < 0) {

			throw new Error(
				"La somme assurée minimum doit être positive."
			);

		}


		if (!Number.isFinite(gridStep) || gridStep <= 0) {

			throw new Error(
				"Le pas de recherche doit être supérieur à zéro."
			);

		}


		if (![9, 25].includes(zoneSize)) {

			throw new Error(
				"La zone de recherche doit contenir 9 ou 25 cellules."
			);

		}
		if (
			!Number.isInteger(maxClusters) ||
			maxClusters <= 0
		) {

			throw new Error(
				"Le nombre maximum de cercles doit être un entier supérieur à zéro."
			);

		}


		return {

			radius,

			threshold,

			gridStep,

			zoneSize,
			
			maxClusters

		};

	}

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
	function formatInteger(value) {

		const numericValue =
			Number(value);


		if (!Number.isFinite(numericValue)) {
			return "—";
		}


		return numericValue.toLocaleString(
			"fr-FR",
			{
				maximumFractionDigits: 0
			}
		);

	}


	function formatCoordinate(value) {

		const numericValue =
			Number(value);


		if (!Number.isFinite(numericValue)) {
			return "—";
		}


		return numericValue.toFixed(5);

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
	// EXCEL EXPORT
	// =====================================================

	function exportSelectedResults() {

		const clusters =
			STATE.selected.results.clusters;


		if (!Array.isArray(clusters) || !clusters.length) {

			updateAnalysisStatus(
				"Aucun résultat à exporter.",
				true
			);

			return;

		}


		if (typeof XLSX === "undefined") {

			updateAnalysisStatus(
				"La bibliothèque Excel n'est pas chargée.",
				true
			);

			return;

		}


		const exportRows =
			clusters.map(cluster => ({

				Rang:
					cluster.rank,

				Somme_assuree:
					Number(cluster.sum_si ?? 0),

				Nombre_risques:
					Number(cluster.nb_obs ?? 0),

				Risques_retires:
					Number(
						cluster.dedup_removed_points ?? 0
					),

				SI_retiree:
					Number(
						cluster.dedup_removed_si ?? 0
					),

				Latitude_centre:
					Number(cluster.center_lat),

				Longitude_centre:
					Number(cluster.center_lon),

				Identifiants_polices:
					Array.isArray(cluster.ids)
						? cluster.ids.join(", ")
						: ""

			}));


		const worksheet =
			XLSX.utils.json_to_sheet(
				exportRows
			);
		worksheet["!cols"] = [

			{ wch: 8 },

			{ wch: 20 },

			{ wch: 18 },

			{ wch: 18 },

			{ wch: 18 },

			{ wch: 18 },

			{ wch: 18 },

			{ wch: 60 }

		];

		const workbook =
			XLSX.utils.book_new();


		XLSX.utils.book_append_sheet(
			workbook,
			worksheet,
			"Resultats"
		);


		const date =
			new Date()
				.toISOString()
				.slice(0, 10);





		const fileName =
			`conflagration_HAVOC_${date}.xlsx`;


		XLSX.writeFile(
			workbook,
			fileName
		);

	}

    // =====================================================
	// RESULTS TABLE
	// =====================================================
	function updateExportButton() {

		const button =
			document.querySelector(
				"#btnExportResults"
			);


		if (!button) {
			return;
		}


		const hasResults =
			STATE.selected.results.clusters.length > 0;


		button.disabled =
			!hasResults;

	}

	function renderTable() {

		const tbody =
			document.querySelector(
				"#resultsTableBody"
			);


		const resultCount =
			document.querySelector(
				"#resultCount"
			);


		if (!tbody) {
			return;
		}


		const clusters =
			STATE.selected.results.clusters;


		tbody.innerHTML =
			"";


		if (!clusters.length) {

			const row =
				document.createElement("tr");


			row.innerHTML = `
				<td colspan="7" class="text-secondary">
					Aucun résultat à afficher.
				</td>
			`;


			tbody.appendChild(row);


			if (resultCount) {
				resultCount.textContent =
					"0 conflagration";
			}

			updateExportButton();
			return;

		}


		for (const cluster of clusters) {

			const row =
				document.createElement("tr");


			row.dataset.rank =
				String(cluster.rank);


			row.style.cursor =
				"pointer";


			row.innerHTML = `
				<td>
					${cluster.rank}
				</td>

				<td>
					${formatSI(cluster.sum_si)}
				</td>

				<td>
					${formatInteger(cluster.nb_obs)}
				</td>

				<td>
					${formatInteger(
						cluster.dedup_removed_points
					)}
				</td>

				<td>
					${formatSI(
						cluster.dedup_removed_si
					)}
				</td>

				<td>
					${formatCoordinate(
						cluster.center_lat
					)}
				</td>

				<td>
					${formatCoordinate(
						cluster.center_lon
					)}
				</td>
			`;


			row.addEventListener(
				"click",
				() => {

					console.log(
						"Selected cluster",
						cluster
					);

					// Map focus will be connected
					// during the mapping step.

				}
			);


			tbody.appendChild(row);

		}


		if (resultCount) {

			resultCount.textContent =
				`${clusters.length.toLocaleString("fr-FR")} conflagration${clusters.length > 1 ? "s" : ""}`;

		}
		
		updateExportButton();

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
	// EXCLUSIVE CLUSTER DEDUPLICATION
	// =====================================================

	function dedupClustersExclusiveByPoints(
		rawResult,
		{
			maxClusters = 50,
			thresholdSI = 0
		} = {}
	) {

		const clusters =
			Array.isArray(rawResult?.clusters)
				? rawResult.clusters
				: [];


		const points =
			Array.isArray(rawResult?.points_in_clusters)
				? rawResult.points_in_clusters
				: [];


		if (!clusters.length) {

			return {

				kept: [],

				droppedTotal: 0,

				rawClustersCount: 0

			};

		}


		// Map policy ID -> SI

		const siById =
			new Map();


		for (const point of points) {

			const id =
				String(
					point.id_policy ?? ""
				);


			if (!id) {
				continue;
			}


			const parsedSI =
				Number(point.SI ?? 0);


			siById.set(
				id,
				Number.isFinite(parsedSI)
					? parsedSI
					: 0
			);

		}


		// Initial ordering by original SI.

		const sorted =
			clusters
				.slice()
				.sort(
					(a, b) =>
						Number(b.sum_si ?? 0) -
						Number(a.sum_si ?? 0)
				);


		// Policies already allocated to a retained cluster.

		const used =
			new Set();


		const kept =
			[];


		let droppedTotal =
			0;


		function getEffectiveCluster(cluster) {

			const originalIds =
				Array.isArray(cluster.ids)
					? cluster.ids.map(String)
					: [];


			const effectiveIds =
				[];


			let effectiveSI =
				0;


			for (const id of originalIds) {

				if (used.has(id)) {
					continue;
				}


				effectiveIds.push(id);


				effectiveSI +=
					siById.get(id) ?? 0;

			}


			const originalSI =
				Number(cluster.sum_si ?? 0);


			const originalCount =
				Number(
					cluster.nb_obs ??
					originalIds.length
				);


			return {

				...cluster,

				ids: effectiveIds,

				sum_si: effectiveSI,

				nb_obs: effectiveIds.length,

				dedup_mode: "exclusive",

				dedup_removed_points:
					Math.max(
						0,
						(
							Number.isFinite(originalCount)
								? originalCount
								: originalIds.length
						) -
						effectiveIds.length
					),

				dedup_removed_si:
					Math.max(
						0,
						(
							Number.isFinite(originalSI)
								? originalSI
								: 0
						) -
						effectiveSI
					)

			};

		}


		while (kept.length < maxClusters) {

			let best =
				null;


			let bestIndex =
				-1;


			for (
				let index = 0;
				index < sorted.length;
				index++
			) {

				const cluster =
					sorted[index];


				if (!cluster) {
					continue;
				}


				const effectiveCluster =
					getEffectiveCluster(cluster);


				if (effectiveCluster.nb_obs <= 1) {
					continue;
				}


				if (
					effectiveCluster.sum_si <
					thresholdSI
				) {
					continue;
				}


				if (
					!best ||
					effectiveCluster.sum_si >
					best.sum_si
				) {

					best =
						effectiveCluster;


					bestIndex =
						index;

				}

			}


			if (!best) {
				break;
			}


			for (const id of best.ids) {
				used.add(String(id));
			}


			sorted[bestIndex] =
				null;


			kept.push(best);

		}


		for (const cluster of kept) {

			droppedTotal +=
				Number(
					cluster.dedup_removed_points ?? 0
				);

		}


		return {

			kept,

			droppedTotal,

			rawClustersCount:
				clusters.length

		};

	}
    // =====================================================
	// CONFLAGRATION ANALYSIS
	// =====================================================

	async function runAnalysis() {

		const button =
			document.querySelector("#btnRun");


		try {

			if (!STATE.selected.data.length) {

				throw new Error(
					"Chargez un portefeuille avant de lancer l'analyse."
				);

			}


			if (typeof runSquaresGrid !== "function") {

				throw new Error(
					"Le moteur ConflagGrid n'est pas chargé."
				);

			}


			const parameters =
				getAnalysisParameters();


			button.disabled =
				true;


			button.textContent =
				"Analyse en cours...";


			updateAnalysisStatus(
				"Calcul en cours..."
			);


			// Allow the browser to display the loading state
			// before starting the synchronous calculation.

			await new Promise(resolve =>
				setTimeout(resolve, 0)
			);


			const rawResult =
				runSquaresGrid(

					JSON.stringify(
						STATE.selected.data
					),

					parameters.radius,

					parameters.threshold,

					parameters.gridStep,

					parameters.zoneSize

				);


			const parsedResult =
				JSON.parse(rawResult);


			if (!parsedResult.ok) {

				throw new Error(
					parsedResult.error ||
					"Erreur pendant l'analyse."
				);

			}


			storeAnalysisResults(
				parsedResult,
				parameters
			);
			
			renderTable();


			updateAnalysisStatus(
				`${STATE.selected.results.clusters.length.toLocaleString("fr-FR")} cercles détectés`
			);


			console.log(
				"Conflagration results",
				STATE.selected.results
			);

		}
		catch (error) {

			resetResults();

			renderTable();
			updateAnalysisStatus(
				error.message,
				true
			);


			console.error(
				"Conflagration analysis error:",
				error
			);

		}
		finally {

			button.disabled =
				false;


			button.textContent =
				"Lancer la détection";

		}

	}
	
	function storeAnalysisResults(
		algorithmResult,
		parameters
	) {

		const deduplicated =
			dedupClustersExclusiveByPoints(
				algorithmResult,
				{

					maxClusters:
						parameters.maxClusters,

					thresholdSI:
						parameters.threshold

				}
			);


		const clusters =
			deduplicated.kept.map(
				(cluster, index) => ({

					...cluster,

					rank: index + 1

				})
			);


		// Keep only policies belonging to a retained cluster.

		const retainedPolicyIds =
			new Set();


		for (const cluster of clusters) {

			for (const id of cluster.ids) {

				retainedPolicyIds.add(
					String(id)
				);

			}

		}


		const rawPoints =
			Array.isArray(
				algorithmResult.points_in_clusters
			)
				? algorithmResult.points_in_clusters
				: [];


		const pointsInClusters =
			rawPoints.filter(
				point =>
					retainedPolicyIds.has(
						String(point.id_policy)
					)
			);


		const normalizedResults = {

			clusters,

			pointsInClusters,

			metadata: {

				rawClustersCount:
					deduplicated.rawClustersCount,

				retainedClustersCount:
					clusters.length,

				removedOverlappingPoints:
					deduplicated.droppedTotal

			}

		};


		STATE.selected.results =
			normalizedResults;


		if (!STATE.selection.active) {

			STATE.data.results = {

				clusters:
					normalizedResults.clusters.slice(),

				pointsInClusters:
					normalizedResults.pointsInClusters.slice(),

				metadata: {
					...normalizedResults.metadata
				}

			};

		}


		STATE.analysis.parameters = {

			radius:
				parameters.radius,

			threshold:
				parameters.threshold,

			gridStep:
				parameters.gridStep,

			zoneSize:
				parameters.zoneSize,

			maxClusters:
				parameters.maxClusters

		};


		STATE.analysis.lastRunAt =
			new Date();

	}
	// =====================================================
	// STATUS
	// =====================================================

	function updateAnalysisStatus(
		message,
		isError = false
	) {

		const status =
			document.querySelector("#fileStatus");


		if (!status) {
			return;
		}


		status.textContent =
			message;


		status.classList.toggle(
			"badge-error",
			isError
		);


		status.classList.toggle(
			"badge-success",
			!isError
		);

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
        .querySelector("#portfolio-file")
        ?.addEventListener(
            "change",
            handleFileLoad
        );
    document
		.querySelector("#btnRun")
		?.addEventListener(
			"click",
			runAnalysis
		);
	 document
		.querySelector("#btnReset")
		?.addEventListener(
			"click",
			fullReset
		);
			
		document
		.querySelector("#btnExportResults")
		?.addEventListener(
			"click",
			exportSelectedResults
		);
}


	boot();

})();