function getAudience(){
	if (Object.hasOwn(sessionStorage,"state")){
		const state = getState();
		
		if (state.user != undefined){
			return state.activeAudience;
		}
	}
	else{
		return null;
	}
	
}

function getTypeOfPages(){
	try{
		
		const href = window.location.href;
		const radical = href.split("pages/")[1];
		const extension = radical.split("/")[1];
		if (extension == undefined){
			return radical.split(".html")[0]
		}
		else{
			return "extension"
		}
	}
	catch(error){
		return "home"
	}
}


function fetchBaseContent(){
	const audience = getAudience();
	
}

function fetchCustomContent(){
	const audience = getAudience();
}



async function updateAudience(){
	if (Object.hasOwn(sessionStorage,"state")){
	
		const state = getState();
		if (state.user != undefined){
			// get audience page
		
			await auth.getPage();
			
			
			document.getElementById("workspace_name").innerHTML = state.user.email;
			if (state.memberships.length>1){
			let iHTML = '<select id="scenario">'
			for (let step=0; step<state.memberships.length;step++){
				iHTML += `<option>${state.memberships[step].label}</option>`
			}
			iHTML += "</select>"
			document.getElementById("workspace_type").innerHTML = iHTML;
		}
			else {
				document.getElementById("workspace_type").innerHTML = state.memberships[0].label;
			}
		
	
		
		}

		else {
			document.getElementById("workspace_name").innerHTML = "Espace public"
			document.getElementById("workspace_type").innerHTML = "Demonstration"
		
		// get standard page
			
		}
	}
	
}


function pageLoading(){
	const page_type = getTypeOfPages();
	console.log(page_type);
	
	const audience = fetchBaseContent();
	
	// Try adding an event listener for the login form
	try{
		document.getElementById("login-form").addEventListener("submit", login);
		
	}

	catch(error){
		// if raising error : check if is logged 
		if(isLogged()){
			// if yes change login link with logout and remove token + state #and onclick come back to home
			console.log("Changing the login label");
			var log_link = document.getElementById("login_link");
			log_link.innerHTML = "Logout";
			
			log_link.href = "javascript:logout();window.location.replace(AUTH_CONFIG.loginUrl);";

		}
	}
	
	updateAudience();

}


pageLoading();
//updateAudience();

