// ConflagGrid.js — Sparse fixed-step grid-center clustering
// Public API: runSquaresGrid(json_rows, radius_meters, threshold_si, grid_step_m, nb_cells_zone)

(function () {
    "use strict";

    const R_EARTH = 6371000.0;
    const CENTER_KEY_DECIMALS = 5;

    // --- Small utilities ------------------------------------------------------
    const toRad = d => (d * Math.PI) / 180.0;
    const toDeg = r => (r * 180.0) / Math.PI;

    function projectToXY(lat, lon, lat0, lon0) {
        const latRad = toRad(lat);
        const lonRad = toRad(lon);
        const lat0Rad = toRad(lat0);
        const lon0Rad = toRad(lon0);

        const x = R_EARTH * (lonRad - lon0Rad) * Math.cos(lat0Rad);
        const y = R_EARTH * (latRad - lat0Rad);

        return [x, y];
    }

    function inverseProject(x, y, lat0, lon0) {
        const lat0Rad = toRad(lat0);
        const dlat = y / R_EARTH;
        const dlon = x / (R_EARTH * Math.cos(lat0Rad));

        return [
            lat0 + toDeg(dlat),
            lon0 + toDeg(dlon)
        ];
    }

    function roundDec(n, d) {
        const f = Math.pow(10, d);
        return Math.round(n * f) / f;
    }

    function cellKey(ix, iy) {
        return ix + "," + iy;
    }

    // --- Sparse grid index ----------------------------------------------------
    function buildSparseGrid(xs, ys, sis, cellSize) {
        const grid = new Map();

        for (let i = 0; i < xs.length; i++) {
            const ix = Math.floor(xs[i] / cellSize);
            const iy = Math.floor(ys[i] / cellSize);
            const key = cellKey(ix, iy);

            let cell = grid.get(key);

            if (!cell) {
                cell = {
                    ix,
                    iy,
                    indices: [],
                    sum_si: 0.0
                };

                grid.set(key, cell);
            }

            cell.indices.push(i);
            cell.sum_si += sis[i];
        }

        return grid;
    }

    function getZoneReach(nbCellsZone) {
        if (nbCellsZone === 9) return 1;
        if (nbCellsZone === 25) return 2;

        throw new Error("nb_cells_zone must be 9 or 25");
    }

    function getZoneCells(grid, ix, iy, reach) {
        const cells = [];

        for (let dx = -reach; dx <= reach; dx++) {
            for (let dy = -reach; dy <= reach; dy++) {
                const cell = grid.get(cellKey(ix + dx, iy + dy));

                if (cell) {
                    cells.push(cell);
                }
            }
        }

        return cells;
    }

    function getZoneSumSi(zoneCells) {
        let sumSi = 0.0;

        for (let i = 0; i < zoneCells.length; i++) {
            sumSi += zoneCells[i].sum_si;
        }

        return sumSi;
    }

    function getZonePolicyIndices(zoneCells) {
        let totalLength = 0;

        for (let i = 0; i < zoneCells.length; i++) {
            totalLength += zoneCells[i].indices.length;
        }

        const indices = new Array(totalLength);
        let position = 0;

        for (let i = 0; i < zoneCells.length; i++) {
            const cellIndices = zoneCells[i].indices;

            for (let j = 0; j < cellIndices.length; j++) {
                indices[position++] = cellIndices[j];
            }
        }

        return indices;
    }

    // --- Main entry point -----------------------------------------------------
    function runSquaresGrid(
        json_rows,
        radius_meters,
        threshold_si,
        grid_step_m,
        nb_cells_zone
    ) {
        // 1) Validate parameters
        const radius = Number(radius_meters);
        const threshold = Number(threshold_si);
        const step = Number(grid_step_m);
        const zoneSize = Number(nb_cells_zone);

        if (!isFinite(radius) || radius <= 0) {
            return JSON.stringify({
                ok: false,
                error: "radius_meters must be greater than 0"
            });
        }

        if (!isFinite(threshold)) {
            return JSON.stringify({
                ok: false,
                error: "threshold_si must be numeric"
            });
        }

        if (!isFinite(step) || step <= 0) {
            return JSON.stringify({
                ok: false,
                error: "grid_step_m must be greater than 0"
            });
        }

        let zoneReach;

        try {
            zoneReach = getZoneReach(zoneSize);
        } catch (e) {
            return JSON.stringify({
                ok: false,
                error: e.message
            });
        }

        // 2) Parse input rows
        let rows;

        try {
            rows = JSON.parse(json_rows);

            if (!Array.isArray(rows)) {
                throw new Error("JSON is not an array");
            }
        } catch (e) {
            return JSON.stringify({
                ok: false,
                error: "Invalid JSON: " + e.message
            });
        }

        // 3) Clean and deduplicate policies
        const lat = [];
        const lon = [];
        const si = [];
        const ids = [];
        const locs = [];

        const seenIds = Object.create(null);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] || {};

            const la = Number(row.Latitude);
            const lo = Number(row.Longitude);
            const siv = Number(row.SI);
            const idp = String(row.id_policy || "");
            const loc = String(row.Localisation || "").trim();

            if (
                isFinite(la) &&
                isFinite(lo) &&
                isFinite(siv) &&
                siv !== 0 &&
                idp.length > 0 &&
                !Object.prototype.hasOwnProperty.call(seenIds, idp)
            ) {
                lat.push(la);
                lon.push(lo);
                si.push(siv);
                ids.push(idp);
                locs.push(loc);

                seenIds[idp] = true;
            }
        }

        if (lat.length === 0) {
            return JSON.stringify({
                ok: false,
                error: "No proper data has been found in the sheet"
            });
        }

        // 4) Stable metric projection
        const LAT0 =
            lat.reduce((sum, value) => sum + value, 0) / lat.length;

        const LON0 =
            lon.reduce((sum, value) => sum + value, 0) / lon.length;

        const X = new Array(lat.length);
        const Y = new Array(lat.length);

        for (let i = 0; i < lat.length; i++) {
            const xy = projectToXY(
                lat[i],
                lon[i],
                LAT0,
                LON0
            );

            X[i] = xy[0];
            Y[i] = xy[1];
        }

        // 5) Sparse cells of size radius
        const cellSize = radius;
        const grid = buildSparseGrid(X, Y, si, cellSize);
        const occupiedCells = Array.from(grid.values());

        const radius2 = radius * radius;

        const results = [];
        const pointsMap = Object.create(null);
        const emittedIdSets = new Set();
        const seenCenters = Object.create(null);

        // 6) Process each occupied cell independently
        for (let cellIndex = 0; cellIndex < occupiedCells.length; cellIndex++) {
            const centralCell = occupiedCells[cellIndex];

            const zoneCells = getZoneCells(
                grid,
                centralCell.ix,
                centralCell.iy,
                zoneReach
            );

            // Coarse upper-bound filter
            const zoneSumSi = getZoneSumSi(zoneCells);

            if (zoneSumSi < threshold) {
                continue;
            }

            const zonePolicyIndices =
                getZonePolicyIndices(zoneCells);

            const xmin = centralCell.ix * cellSize;
            const xmax = xmin + cellSize;
            const ymin = centralCell.iy * cellSize;
            const ymax = ymin + cellSize;

            const nbStepsX = Math.ceil(cellSize / step);
            const nbStepsY = Math.ceil(cellSize / step);

            // 7) Fixed-step candidate centers inside the central cell
            for (let kx = 0; kx <= nbStepsX; kx++) {
                const x0 = Math.min(
                    xmin + kx * step,
                    xmax
                );

                for (let ky = 0; ky <= nbStepsY; ky++) {
                    const y0 = Math.min(
                        ymin + ky * step,
                        ymax
                    );

                    // Center de-dup across adjacent cells
                    const centerXYKey =
                        roundDec(x0, 6) + "," +
                        roundDec(y0, 6);

                    if (
                        Object.prototype.hasOwnProperty.call(
                            seenCenters,
                            centerXYKey
                        )
                    ) {
                        continue;
                    }

                    seenCenters[centerXYKey] = true;

                    const squareIndices = [];
                    let squareSumSi = 0.0;

                    // 8) Fast 2R x 2R square filter
                    for (
                        let candidateIndex = 0;
                        candidateIndex < zonePolicyIndices.length;
                        candidateIndex++
                    ) {
                        const policyIndex =
                            zonePolicyIndices[candidateIndex];

                        const dx = X[policyIndex] - x0;

                        if (dx < -radius || dx > radius) {
                            continue;
                        }

                        const dy = Y[policyIndex] - y0;

                        if (dy < -radius || dy > radius) {
                            continue;
                        }

                        squareIndices.push(policyIndex);
                        squareSumSi += si[policyIndex];
                    }

                    if (squareSumSi < threshold) {
                        continue;
                    }

                    // 9) Exact circular accumulation
                    let circleSumSi = 0.0;
                    const memberIndices = [];

                    for (
                        let candidateIndex = 0;
                        candidateIndex < squareIndices.length;
                        candidateIndex++
                    ) {
                        const policyIndex =
                            squareIndices[candidateIndex];

                        const dx = X[policyIndex] - x0;
                        const dy = Y[policyIndex] - y0;

                        if (
                            dx * dx + dy * dy <= radius2
                        ) {
                            circleSumSi += si[policyIndex];
                            memberIndices.push(policyIndex);
                        }
                    }

                    if (
                        circleSumSi < threshold ||
                        memberIndices.length <= 1
                    ) {
                        continue;
                    }

                    // 10) Strong de-dup by policy set
                    const idsSorted = memberIndices
                        .map(index => String(ids[index]))
                        .sort();

                    const idsKey = idsSorted.join("|");

                    if (emittedIdSets.has(idsKey)) {
                        continue;
                    }

                    emittedIdSets.add(idsKey);

                    const centerLatLon = inverseProject(
                        x0,
                        y0,
                        LAT0,
                        LON0
                    );

                    const centerLat = centerLatLon[0];
                    const centerLon = centerLatLon[1];

                    const geographicCenterKey =
                        roundDec(
                            centerLat,
                            CENTER_KEY_DECIMALS
                        ) +
                        "," +
                        roundDec(
                            centerLon,
                            CENTER_KEY_DECIMALS
                        );

                    const locSet = Object.create(null);

                    for (
                        let memberIndex = 0;
                        memberIndex < memberIndices.length;
                        memberIndex++
                    ) {
                        const policyIndex =
                            memberIndices[memberIndex];

                        const policyId =
                            String(ids[policyIndex]);

                        if (
                            !Object.prototype.hasOwnProperty.call(
                                pointsMap,
                                policyId
                            )
                        ) {
                            pointsMap[policyId] = {
                                id_policy: policyId,
                                Latitude: lat[policyIndex],
                                Longitude: lon[policyIndex],
                                SI: si[policyIndex],
                                Localisation: locs[policyIndex]
                            };
                        }

                        const localisation =
                            String(
                                locs[policyIndex] || ""
                            ).trim();

                        if (localisation.length > 0) {
                            locSet[localisation] = true;
                        }
                    }

                    results.push({
                        center_lat: centerLat,
                        center_lon: centerLon,
                        nb_obs: memberIndices.length,
                        sum_si: circleSumSi,
                        ids: idsSorted,
                        localisations: Object.keys(locSet).sort(),
                        center_key: geographicCenterKey
                    });
                }
            }
        }

        // 11) Stable output
        const points_in_clusters = [];

        for (const key in pointsMap) {
            if (
                Object.prototype.hasOwnProperty.call(
                    pointsMap,
                    key
                )
            ) {
                points_in_clusters.push(pointsMap[key]);
            }
        }

        points_in_clusters.sort((a, b) =>
            a.id_policy < b.id_policy
                ? -1
                : a.id_policy > b.id_policy
                    ? 1
                    : 0
        );

        return JSON.stringify({
            ok: true,
            clusters: results,
            points_in_clusters
        });
    }

    // Attach globally
    if (typeof globalThis !== "undefined") {
        globalThis.runSquaresGrid = runSquaresGrid;
    } else if (typeof window !== "undefined") {
        window.runSquaresGrid = runSquaresGrid;
    } else if (typeof this !== "undefined") {
        this.runSquaresGrid = runSquaresGrid;
    }
})();