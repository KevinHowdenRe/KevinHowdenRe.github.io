function getAudience(){
	if (Object.hasOwn(sessionStorage,"state")){
		const state = sessionStorage.state;
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



function pageLoading(){
	const page_type = getTypeOfPages();
	console.log(page_type);
	
	const audience = fetchBaseContent();
	
	console.log(audience);
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
		
		// get audience page
		
		await auth.getPage();
		
		}

		else {
			console.log("no state ?");
			document.getElementById("workspace_name").innerHTML = "Espace public"
			document.getElementById("workspace_type").innerHTML = "Demonstration"
		
		// get standard page
			
		}
	}
	
}


console.log(sessionStorage);
pageLoading();
//updateAudience();

