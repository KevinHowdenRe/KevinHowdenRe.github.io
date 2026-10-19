


function update_audience(state){
	if (Object.hasOwn(state.user,"email")){
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
		document.getElementById("workspace_name").innerHTML = 
		document.getElementById("workspace_type").innerHTML = "Demonstration"
	}
	
	
	
}

let state = getState();
console.log(JSON.stringify(state));
if (state=== null){
	
}
else{
	update_audience(state);
}
