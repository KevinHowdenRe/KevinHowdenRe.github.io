


function update_audience(){
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
		console.log("no state ?");
		document.getElementById("workspace_name").innerHTML = "Espace public"
		document.getElementById("workspace_type").innerHTML = "Demonstration"
	}
	
	
	
}
console.log(sessionStorage);

if (Object.hasOwn(sessionStorage,"state")){
	update_audience();
}
