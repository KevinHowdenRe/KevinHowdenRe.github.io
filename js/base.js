/* =========================================================
   BASE.JS
   Shared generic UI behaviours
   No application-specific logic should go here.
   ========================================================= */

"use strict";


/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */

const $ = (selector, context = document) =>
    context.querySelector(selector);

const $$ = (selector, context = document) =>
    [...context.querySelectorAll(selector)];


/* ---------------------------------------------------------
   Modals
   --------------------------------------------------------- */

function openModal(target) {
    const modal =
        typeof target === "string"
            ? document.querySelector(target)
            : target;

    if (!modal) return;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}


function closeModal(target) {
    const modal =
        typeof target === "string"
            ? document.querySelector(target)
            : target;

    if (!modal) return;

    modal.classList.remove("active");

    if (!document.querySelector(".modal.active")) {
        document.body.style.overflow = "";
    }
}


function initModals() {

    document.addEventListener("click", (event) => {

        const openButton = event.target.closest("[data-modal-open]");

        if (openButton) {
            const target = openButton.dataset.modalOpen;
            openModal(target);
            return;
        }


        const closeButton = event.target.closest("[data-modal-close]");

        if (closeButton) {
            const modal = closeButton.closest(".modal");

            if (modal) {
                closeModal(modal);
            }

            return;
        }


        if (
            event.target.classList.contains("modal") &&
            event.target.classList.contains("active")
        ) {
            closeModal(event.target);
        }
    });


    document.addEventListener("keydown", (event) => {

        if (event.key !== "Escape") return;

        const modal = document.querySelector(".modal.active");

        if (modal) {
            closeModal(modal);
        }
    });
}


/* ---------------------------------------------------------
   Dropdowns
   --------------------------------------------------------- */

function initDropdowns() {

    document.addEventListener("click", (event) => {

        const trigger = event.target.closest("[data-dropdown-toggle]");

        if (trigger) {

            const dropdown = trigger.closest(".dropdown");

            if (!dropdown) return;

            $$(".dropdown.active").forEach((item) => {

                if (item !== dropdown) {
                    item.classList.remove("active");
                }

            });

            dropdown.classList.toggle("active");

            return;
        }


        if (!event.target.closest(".dropdown")) {

            $$(".dropdown.active").forEach((dropdown) => {
                dropdown.classList.remove("active");
            });

        }

    });

}


/* ---------------------------------------------------------
   Mobile navigation
   --------------------------------------------------------- */

function initNavigation() {

    document.addEventListener("click", (event) => {

        const trigger = event.target.closest("[data-nav-toggle]");

        if (!trigger) return;

        const selector = trigger.dataset.navToggle;
        const nav = document.querySelector(selector);

        if (!nav) return;

        nav.classList.toggle("active");

        trigger.setAttribute(
            "aria-expanded",
            nav.classList.contains("active")
        );

    });

}


/* ---------------------------------------------------------
   Toast notifications
   --------------------------------------------------------- */

function getToastContainer() {

    let container = document.querySelector(".toast-container");

    if (!container) {

        container = document.createElement("div");
        container.className = "toast-container";

        document.body.appendChild(container);

    }

    return container;
}


function showToast(
    message,
    type = "default",
    duration = 3000
) {

    const container = getToastContainer();

    const toast = document.createElement("div");

    toast.className = "toast";

    if (type === "success") {
        toast.classList.add("toast-success");
    }

    if (type === "danger" || type === "error") {
        toast.classList.add("toast-danger");
    }

    toast.textContent = message;

    container.appendChild(toast);


    window.setTimeout(() => {

        toast.remove();

        if (!container.children.length) {
            container.remove();
        }

    }, duration);

}


/* ---------------------------------------------------------
   Buttons loading state
   --------------------------------------------------------- */

function setButtonLoading(
    button,
    loading = true,
    loadingText = "Loading..."
) {

    if (!button) return;


    if (loading) {

        if (!button.dataset.originalText) {
            button.dataset.originalText = button.innerHTML;
        }

        button.disabled = true;

        button.innerHTML = `
            <span class="spinner"></span>
            <span>${loadingText}</span>
        `;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }

    }

}


/* ---------------------------------------------------------
   Generic show / hide
   --------------------------------------------------------- */

function showElement(target) {

    const element =
        typeof target === "string"
            ? document.querySelector(target)
            : target;

    if (!element) return;

    element.classList.remove("hidden");
}


function hideElement(target) {

    const element =
        typeof target === "string"
            ? document.querySelector(target)
            : target;

    if (!element) return;

    element.classList.add("hidden");
}


function toggleElement(target) {

    const element =
        typeof target === "string"
            ? document.querySelector(target)
            : target;

    if (!element) return;

    element.classList.toggle("hidden");
}


/* ---------------------------------------------------------
   Generic data-toggle
   --------------------------------------------------------- */

function initToggles() {

    document.addEventListener("click", (event) => {

        const trigger = event.target.closest("[data-toggle]");

        if (!trigger) return;

        const selector = trigger.dataset.toggle;

        if (!selector) return;

        const target = document.querySelector(selector);

        if (!target) return;

        target.classList.toggle("hidden");

    });

}

/* ---------------------------------------------------------
   Light mode / Dark mode
   --------------------------------------------------------- */
   


   
function setTheme(themeName) {
    const htmlElement = document.documentElement; 
	htmlElement.setAttribute('data-theme', themeName);
	if (themeName==="light"){
	  console.log("Jour !")
	  document.getElementById("interrupteur").innerHTML = "☼"
  }
  else{
	  console.log("Nuit !");
	  console.log(themeName);
	  document.getElementById("interrupteur").innerHTML = "☾"
  }
  }

  
   
function switchLight() {
  const htmlElement = document.documentElement; // cible la balise <html>
  const currentTheme = htmlElement.getAttribute('data-theme');
  
  // Bascule entre 'dark' et 'light'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
 
  setTheme(newTheme);

  localStorage.setItem('theme', newTheme);
}




/* ---------------------------------------------------------
   Initialization
   --------------------------------------------------------- */

function initBaseUI() {

    initModals();
    initDropdowns();
    initNavigation();
    initToggles();
	

    if (localStorage.getItem('theme')) {
      setTheme(localStorage.getItem('theme'))
    } 
	else {
      setTheme('dark')
    }

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initBaseUI
    );

} else {

    initBaseUI();

}


/* ---------------------------------------------------------
   Public API
   --------------------------------------------------------- */

window.BaseUI = {

    openModal,
    closeModal,

    showToast,

    setButtonLoading,

    showElement,
    hideElement,
    toggleElement

};