const base_radical = ["articles","solutions","documentation","index"]


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
		console.log(href);
		console.log(radical);
		console.log(extension);
		if (extension == undefined){
			return radical.split(".html")[0]
		}
		else{
			return extension
		}
	}
	catch(error){
		return "index"
	}
}
async function loadUnloggedPage(radical) {
	
	if (base_radical.includes(radical)){
		// load page 
		const response = await fetch(`./base/${radical}.html`);
		const html = await response.text();

		const content =  new DOMParser()
						.parseFromString(html, 'text/html')
						.body
						.innerHTML;
						
		document.getElementById("content").innerHTML = content;
		}
	
	else if (radical=="login"){
		// do nothing 
	}
	
	else{
		// error 401
	}
	
	
   
}


async function loadLoggedPage(radical){
	// to do
}


async function updateAudience(){
	if (Object.hasOwn(sessionStorage,"state")){
	
		const state = getState();
		if (state.user != undefined){
		
			
			
			
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
	const logged = isLogged();
	const radical = getTypeOfPages();
	
	// Try adding an event listener for the login form
	try{
		document.getElementById("login-form").addEventListener("submit", login);
		
	}

	catch(error){
		// if raising error : check if is logged 
		if(logged){
			// if yes change login link with logout and remove token + state #and onclick come back to home
			var log_link = document.getElementById("login_link");
			log_link.innerHTML = "Logout";
			
			log_link.href = "javascript:logout();window.location.replace(AUTH_CONFIG.loginUrl);";

		}
	}
	
	if (logged){
	}
	
	else{
		loadUnloggedPage(radical);
	}
	
	
	updateAudience();

}


pageLoading();


