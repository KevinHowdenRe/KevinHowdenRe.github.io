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
        const result = await auth.login(
            email,
            password
        );

		console.log(result);
        if (!result.ok) {

            errorElement.textContent =
                "Invalid email or password.";

            errorElement.style.display = "block";

            return;
        }


        // État retourné par le serveur
        const state = result.state;

        console.log("User:", state.user);
        console.log("Memberships:", state.memberships);
        console.log("Active audience:", state.activeAudience);


        // Le token est déjà stocké dans sessionStorage
        console.log(
            "Token:",
            auth.getToken()
        );


        // Redirection
        //window.location.href = "account.html";

    }

    catch (error) {
		  console.error("LOGIN ERROR:", error);
        errorElement.textContent =
            "Unable to connect to the server.";

        errorElement.style.display = "block";

    }

}