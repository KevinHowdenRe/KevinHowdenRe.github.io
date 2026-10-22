




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
		if (state.user != undefined){
			return true;
		}
	}
	else{
		return false;
	}
	
}

Storage {analytics_session_id: '9994dbfe-1de8-473b-9a13-3a3f40b824ab', length: 1}

Storage {auth_token: '9pB3rxCi2OxbXrKtv3SKjN2xeJHKibnakwEvNyG08MU', analytics_session_id: '9994dbfe-1de8-473b-9a13-3a3f40b824ab', state: '{"ready":true,"loggedIn":true,"user":{"created_at"…mo","site_id":"HALdev"}],"activeAudience":"demo"}', length: 3}

function logout(){
	// removed token 
	clearToken();
	// remove state
	 clearState();
}



// Try adding an event listener for the login form
try{
	document.getElementById("login-form").addEventListener("submit", login);
	
}

catch(error){
	// if raising error : check if is logged 
	if(isLogged()){
		// if yes change login link with logout and remove token + state #and onclick come back to home
		var log_link = document.getElementById("login_link");
		log_link.innerHTML = "Logout";
		log_link.onclick = function() { clearToken();  clearState();};
		
		
		
	}
}



 
// also need to add logout