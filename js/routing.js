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
		const radical = href.split(".io/")[1]; // to change if not github.io pages
		const extension = radical.split("/");
		console.log(href);
		console.log(radical);
		console.log(extension);
		if (extension.length < 2){
			return radical.split(".html")[0]
		}
		else{
			return extension
		}
	}
	catch(error){
		console.log(error);
		return "index"
	}
}


async function servePage(section, id_page) {

	const token = auth.getToken();

	if (!token) {
		return false;
	}

	const response = await fetch(
		AUTH_CONFIG.apiBaseUrl + `/content/HALdev/${section}/${id_page}`,
		{
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`
			}
		}
	);

	if (!response.ok) {
		console.error("Unable to load page:", response.status);
		return false;
	}

	const html = await response.text();
	document.getElementById("content").innerHTML = html;
	updateInfosLogged();
	return true;
}




function updateInfosLogged(){
	var log_link = document.getElementById("login_link");
	log_link.innerHTML = "Logout";
	log_link.href = "javascript:logout();window.location.replace(AUTH_CONFIG.loginUrl);";
	updateAudience();
}


function updateInfosNotLogged(){
	const href = window.location.href;
	const radical = href.split(".io/")[1]; // to change if not github.io pages
	if (radical == "login.html"){
		document.getElementById("login-form").addEventListener("submit", login);
		console.log("added");
	}
}


async function loadUnloggedPage(radical) {
	
	if (base_radical.includes(radical)){
		// load page 
		//const response = await fetch(`./base/${radical}.html`);
		//const html = await response.text();

		//const content =  new DOMParser()
		//				.parseFromString(html, 'text/html')
		//				.body
		//				.innerHTML;
						
		//document.getElementById("content").innerHTML = content;
		}
	
	else if (radical=="login"){
		// do nothing 
	}
	
	else{
		// error 401
	}
	updateInfosNotLogged();
}

async function loadLoggedPage(radical){
	console.log("Serving :");
	if (base_radical.includes(radical)){
		// load radical pages 
		const result = servePage("root",radical);
	}
	else{
		// should not be login page  so extension pages 
		// load extension pages
		const section = radical[0];
		const id_page = radical[1];
		const result = servePage(section, id_page);
	}
	
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
	if (logged){
		loadLoggedPage(radical);
	}
	else{
		loadUnloggedPage(radical);
	}


}


pageLoading();


