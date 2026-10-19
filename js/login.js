

document.getElementById("login-form").addEventListener("submit", login);


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

        // Login + stockage du token + récupération /me
        const state= await auth.login(
            email,
            password
        );
        if (!state.loggedIn) {

            errorElement.textContent =
                "Invalid email or password.";

            errorElement.style.display = "block";

            return;
        }



        // Redirection
        window.location.href = "../index.html";
		//update_audience(state);

    }

    catch (error) {
		  console.error("LOGIN ERROR:", error);
        errorElement.textContent =
            "Unable to connect to the server.";

        errorElement.style.display = "block";

    }

}