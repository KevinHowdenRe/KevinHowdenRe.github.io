




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
       await auth.login(
            email,
            password
        );
		
		const state = getState();
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


function isLogged(){
	if (Object.hasOwn(sessionStorage,"state")){
		const state = getState();
		if (state.user != undefined){
			console.log("Logged !");
			return true;
		}
	}
	else{
		console.log("Not logged ! ");
		return false;
	}
	
}

function logout(){
	// removed token 
	auth.clearToken();
	// remove state
	 clearState();
}






 
// also need to add logout