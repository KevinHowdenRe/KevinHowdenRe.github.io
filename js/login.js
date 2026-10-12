const API_URL = "https://hrf.pythonanywhere.com";


document
    .getElementById("login-form")
    .addEventListener("submit", login);


async function login(event) {

    event.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const errorElement =
        document.getElementById("login-error");

    errorElement.style.display = "none";


    try {

        const response = await fetch(
            API_URL + "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.ok) {

            errorElement.textContent =
                "Invalid email or password.";

            errorElement.style.display = "block";

            return;
        }


        // ---------------------------------------------
        // SAVE BACKEND SESSION
        // ---------------------------------------------

        localStorage.setItem(
            "auth_token",
            data.token
        );


        // ---------------------------------------------
        // ANALYTICS
        // ---------------------------------------------

        if (window.analytics) {

            analytics.track("login");

        }


        // ---------------------------------------------
        // REDIRECT
        // ---------------------------------------------

        window.location.href = "pages/account.html";

    }

    catch (error) {

        errorElement.textContent =
            "Unable to connect to the server.";

        errorElement.style.display = "block";

    }

}
