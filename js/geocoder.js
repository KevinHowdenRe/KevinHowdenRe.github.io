(() => {

    "use strict";


    // =====================================================
    // CONFIGURATION
    // =====================================================

    const GEOCODER_URL =
        "https://nominatim.openstreetmap.org/search";


    // =====================================================
    // SEARCH
    // =====================================================

    async function search(query, options = {}) {

        const text =
            String(query ?? "").trim();


        if (!text) {
            throw new Error(
                "Veuillez saisir une ville ou une adresse."
            );
        }


        const country =
            String(options.country ?? "").trim();


        // Examples:
        //
        // "Luxembourg"
        //      -> "Luxembourg"
        //
        // "Esch-sur-Alzette", country="Luxembourg"
        //      -> "Esch-sur-Alzette, Luxembourg"
        //
        // "10 rue de la Paix", country="France"
        //      -> "10 rue de la Paix, France"

        const fullQuery =
            country
                ? `${text}, ${country}`
                : text;


        const params =
            new URLSearchParams({

                q: fullQuery,

                format: "jsonv2",

                limit: "1",

                addressdetails: "1"

            });


        const response =
            await fetch(
                `${GEOCODER_URL}?${params.toString()}`,
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Impossible d'effectuer la recherche."
            );

        }


        const results =
            await response.json();


        if (
            !Array.isArray(results) ||
            !results.length
        ) {

            throw new Error(
                `Adresse introuvable : ${text}`
            );

        }


        const result =
            results[0];


        const lat =
            Number(result.lat);


        const lon =
            Number(result.lon);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
        ) {

            throw new Error(
                "Coordonnées invalides retournées par le service."
            );

        }


        return {

            lat,

            lon,

            label:
                result.display_name || fullQuery,

            type:
                result.type || null,

            address:
                result.address || null

        };

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.Geocoder = {
        search
    };

})();