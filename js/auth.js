"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const AUTH_CONFIG = {
    apiBaseUrl: "https://hrf.pythonanywhere.com",
    siteId: "HALdev",
    tokenKey: "auth_token",
    debug: false
};


/* ============================================================
   AUTH
   ============================================================ */

const auth = (() => {

    let state = {
        ready: false,
        loggedIn: false,
        user: null,
        memberships: [],
        activeAudience: null
    };


    /* ========================================================
       TOKEN
       ======================================================== */

    function getToken() {
        return sessionStorage.getItem(AUTH_CONFIG.tokenKey);
    }

    function setToken(token) {
        if (token) {
            sessionStorage.setItem(AUTH_CONFIG.tokenKey, token);
        }
    }

    function clearToken() {
        sessionStorage.removeItem(AUTH_CONFIG.tokenKey);
    }


    /* ========================================================
       INTERNAL REQUEST
       ======================================================== */

    async function api(path, options = {}) {

        const headers = new Headers(options.headers || {});
        const token = getToken();

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        const response = await fetch(
            AUTH_CONFIG.apiBaseUrl + path,
            {
                ...options,
                headers
            }
        );
        let data = null;

        try {
            data = await response.json();
        }
        catch {
            data = {};
        }

        return {
            response,
            data
        };
    }


    /* ========================================================
       LOGIN
       ======================================================== */

    async function login(email, password) {

        const result = await api(
            "/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: String(email || "").trim().toLowerCase(),
                    password: String(password || "")
                })
            }
        );

        if (!result.response.ok || !result.data.ok) {
            return {
                ok: false,
                error: result.data.error || "login_failed"
            };
        }

        setToken(result.data.token);

        const currentState = await refresh();

        if (!currentState.loggedIn) {
            clearToken();

            return {
                ok: false,
                error: "session_validation_failed"
            };
        }

        if (
            typeof analytics !== "undefined" &&
            analytics &&
            typeof analytics.track === "function"
        ) {
            analytics.track("login");
        }
		setState(currentState);
        return getState();
    }


    /* ========================================================
       LOGOUT
       ======================================================== */

    async function logout() {

        const token = getToken();

        if (token) {
            try {
                await api(
                    "/api/auth/logout",
                    {
                        method: "POST"
                    }
                );
            }
            catch (error) {
                if (AUTH_CONFIG.debug) {
                    console.warn("[auth] logout error", error);
                }
            }
        }

        clearToken();
        resetState();

        if (
            typeof analytics !== "undefined" &&
            analytics &&
            typeof analytics.track === "function"
        ) {
            analytics.track("logout");
        }

        return getState();
    }


    /* ========================================================
       REFRESH / ME
       ======================================================== */

    async function refresh() {

        const token = getToken();

        if (!token) {
            resetState();
            state.ready = true;
            return getState();
        }

        try {

            const siteId = encodeURIComponent(AUTH_CONFIG.siteId);

            const result = await api(
                `/api/auth/me?site_id=${siteId}`
            );

            if (!result.response.ok || !result.data.ok) {

                if (result.response.status === 401) {
                    clearToken();
                }

                resetState();
                state.ready = true;

                return getState();
            }

            state = {
                ready: true,
                loggedIn: true,
                user: result.data.user || null,
                memberships: Array.isArray(result.data.memberships)
                    ? result.data.memberships
                    : [],
                activeAudience: result.data.memberships[0]["audience"] || null
            };
			setState(state);
            return getState();

        }
        catch (error) {

            if (AUTH_CONFIG.debug) {
                console.warn("[auth] refresh error", error);
            }

            resetState();
            state.ready = true;

            return getState();
        }
    }


    /* ========================================================
       AUDIENCE
       ======================================================== */

    async function setAudience(audience) {

        if (!getToken()) {
            return {
                ok: false,
                error: "not_logged_in"
            };
        }

        const result = await api(
            "/api/auth/set-audience",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    site_id: AUTH_CONFIG.siteId,
                    audience: String(audience || "").trim()
                })
            }
        );

        if (!result.response.ok || !result.data.ok) {
            return {
                ok: false,
                error: result.data.error || "set_audience_failed"
            };
        }

        state.activeAudience = result.data.audience;

        return getState();
    }


    /* ========================================================
       MEMBERSHIPS
       ======================================================== */

    function hasMembership(audience) {

        return state.memberships.some(
            membership =>
                membership.audience === audience
        );
    }

    function hasAnyMembership() {
        return state.memberships.length > 0;
    }


    /* ========================================================
       STATE
       ======================================================== */

    function resetState() {
        state = {
            ready: false,
            loggedIn: false,
            user: null,
            memberships: [],
            activeAudience: null
        };
    }

    function getState() {
        return {
            ready: state.ready,
            loggedIn: state.loggedIn,
            user: state.user ? { ...state.user } : null,
            memberships: state.memberships.map(item => ({ ...item })),
            activeAudience: state.activeAudience
        };
    }


    /* ========================================================
       INIT
       ======================================================== */

    async function init() {
        return refresh();
    }


    /* ========================================================
       PUBLIC API
       ======================================================== */

    return {
        init,
        login,
        logout,
        refresh,
        setAudience,
        hasMembership,
        hasAnyMembership,
        getState,
        getToken
    };

})();


/* ============================================================
   GLOBAL EXPORT
   ============================================================ */

window.auth = auth;
