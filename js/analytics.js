"use strict";


/* ============================================================
   CONFIGURATION
   ============================================================ */

const ANALYTICS_CONFIG = {

    // Backend
    endpoint: "https://hrf.pythonanywhere.com/api/analytics/event",

    // À modifier pour chaque projet
    siteId: "HALdev",

    // Enregistre automatiquement l'ouverture de la page
    trackPageView: true,

    // Affiche les erreurs dans la console
    debug: false
};


/* ============================================================
   ANALYTICS
   ============================================================ */

const analytics = (() => {

    const SESSION_KEY = "analytics_session_id";


    /* ========================================================
       SESSION
       ======================================================== */

    function generateSessionId() {

        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return (
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2)
        );
    }


    function getSessionId() {

        let sessionId = sessionStorage.getItem(
            SESSION_KEY
        );

        if (!sessionId) {

            sessionId = generateSessionId();

            sessionStorage.setItem(
                SESSION_KEY,
                sessionId
            );
        }

        return sessionId;
    }


    /* ========================================================
       PATH
       ======================================================== */

    function getPath() {

        /*
        On envoie uniquement pathname.

        Exemple :

        https://example.com/dashboard?id=123

        devient :

        /dashboard

        La query string n'est donc pas envoyée.
        */

        return window.location.pathname;
    }


    /* ========================================================
       METADATA
       ======================================================== */

    function cleanMetadata(metadata) {

        if (
            metadata === null ||
            metadata === undefined
        ) {
            return {};
        }

        if (
            typeof metadata !== "object" ||
            Array.isArray(metadata)
        ) {
            return {};
        }

        return metadata;
    }


    /* ========================================================
       SEND
       ======================================================== */

    async function send(eventType, metadata = {}) {

        if (!eventType) {
            return false;
        }

        const payload = {

            site_id: ANALYTICS_CONFIG.siteId,

            event_type: String(eventType),

            session_id: getSessionId(),

            path: getPath(),

            metadata: cleanMetadata(metadata)
        };


        try {

            const response = await fetch(
                ANALYTICS_CONFIG.endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload),

                    keepalive: true
                }
            );


            if (!response.ok) {

                if (ANALYTICS_CONFIG.debug) {

                    console.warn(
                        "[analytics] Request failed:",
                        response.status
                    );
                }

                return false;
            }


            if (ANALYTICS_CONFIG.debug) {

                console.log(
                    "[analytics]",
                    eventType,
                    payload
                );
            }


            return true;

        }

        catch (error) {

            /*
            Analytics ne doit jamais casser
            le fonctionnement du site.
            */

            if (ANALYTICS_CONFIG.debug) {

                console.warn(
                    "[analytics] Error:",
                    error
                );
            }

            return false;
        }
    }


    /* ========================================================
       PUBLIC TRACK
       ======================================================== */

    function track(eventType, metadata = {}) {

        /*
        Fire-and-forget par défaut.

        Le frontend n'a normalement pas besoin
        d'attendre l'analytics.
        */

        void send(
            eventType,
            metadata
        );
    }


    /* ========================================================
       PAGE VIEW
       ======================================================== */

    function trackPageView() {

        track(
            "page_view"
        );
    }


    /* ========================================================
       INITIALIZATION
       ======================================================== */

    function init() {

        if (!ANALYTICS_CONFIG.siteId) {

            if (ANALYTICS_CONFIG.debug) {

                console.warn(
                    "[analytics] Missing siteId"
                );
            }

            return;
        }


        if (ANALYTICS_CONFIG.trackPageView) {

            trackPageView();
        }
    }


    /* ========================================================
       PUBLIC API
       ======================================================== */

    return {

        init,

        track,

        trackPageView,

        getSessionId

    };

})();


/* ============================================================
   AUTO START
   ============================================================ */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        analytics.init
    );

}
else {

    analytics.init();

}