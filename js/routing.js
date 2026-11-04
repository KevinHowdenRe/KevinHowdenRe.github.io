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
function loadScript(src) {

    return new Promise((resolve, reject) => {

        // Already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement("script");

        script.src = src;
        script.onload = resolve;
        script.onerror = () =>
            reject(new Error(`Failed to load script: ${src}`));

        document.head.appendChild(script);
    });
}
async function injectScript(tag_scripts){
	const scriptContainer = content.querySelector(`[${tag_scripts}]`);

    if (!scriptContainer) return;

    const scripts = scriptContainer.dataset.scripts
        .split(",")
        .map(src => src.trim())
        .filter(Boolean);

    // 4. Load them
    for (const src of scripts) {
        await loadScript(src);
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




async function serveLocalPage(localPath, tag_html, tag_scripts){
	
	const response = await fetch(localPath);
	const html = await response.text();

	const content =  new DOMParser()
					.parseFromString(html, 'text/html')
					.body
					.innerHTML;
					
	document.getElementById(tag_html).innerHTML = content; 
	
	injectScript(tag_scripts)

		
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
	}
}


async function loadUnloggedPage(radical) {
	
	if (base_radical.includes(radical)){
		const localPath = `./base/${radical}.html`
		serveLocalPage(localPath, "content", "data-scripts")
		}
	
	else if (radical=="login"){
		// do nothing 
	}
	
	else{
		// error 401
		
	
		const id_page = radical[1].split("#")[1];
		
		const localPath = `./${id_page}.html`
		serveLocalPage(localPath, "content", "data-scripts")
		
		
	}
	updateInfosNotLogged();
}

async function loadLoggedPage(radical){
	//console.log("Serving :");
	if (base_radical.includes(radical)){
		// load radical pages 
		const result = servePage("root",radical);
	}
	else{
		// should not be login page  so extension pages 
		// load extension pages
		const section = radical[0];
		const id_page = radical[1].split("#")[1];
		const result = servePage(section, id_page);
	}
	
}


async function changeAudience(audience) {

    const result = await auth.api("/api/auth/audience", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            site_id: AUTH_CONFIG.siteId,
            audience: audience
        })
    });

    if (!result.response.ok || !result.data.ok) {
        return;
    }
	//console.log(".......")
	//console.log("IS ACTIVATED")
	let state = getState();
	//console.log(state.activeAudience);
	state.activeAudience = audience;
	setState(state);
	//console.log(".......")
    pageLoading();
}

function setSelectDd(dd_id, dd_value){
	var dropdown = document.getElementById(dd_id);
	for (var i = 0; i < dropdown.options.length; i++) {
		if (dropdown.options[i].value === dd_value) {
			dropdown.options[i].selected = true;
			break;
		}
	}
}

async function updateAudience() {

    if (Object.hasOwn(sessionStorage, "state")) {

        const state = getState();

        if (state.user != undefined) {

            document.getElementById("workspace_name").innerHTML = state.user.email;

            if (state.memberships.length > 1) {

                let iHTML = '<select id="memberships" onchange="changeAudience(this.value)">';

				for (let step = 0; step < state.memberships.length; step++) {
					iHTML += `
						<option value="${state.memberships[step].audience}">
							${state.memberships[step].label}
						</option>
					`;
				}

				iHTML += "</select>";

                document.getElementById("workspace_type").innerHTML = iHTML;
				setSelectDd("memberships",state.activeAudience);
            } else if (state.memberships.length === 1) {

                document.getElementById("workspace_type").innerHTML =
                    state.memberships[0].label;
            }

        } else {

            document.getElementById("workspace_name").innerHTML = "Espace public";
            document.getElementById("workspace_type").innerHTML = "Demonstration";
        }
    }
}

function pageLoading(){
	const logged = isLogged();
	const radical = getTypeOfPages();
	if (logged){
		//console.log("loading a private page");
		loadLoggedPage(radical);
	}
	else{
		//console.log("loading a public page");
		loadUnloggedPage(radical);
	}


}


pageLoading();


