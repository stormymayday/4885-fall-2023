import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.js";

export default class RegistrationPage extends HTMLElement {

    constructor() {

        super();

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('registration-page-template');

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);

        this.querySelector("#registration-form").addEventListener("submit", event => {

            const passwordInput = document.querySelector('#password').value;
            const emailInput = document.querySelector('#email').value;

            event.preventDefault();

            console.log(`${passwordInput}`);
            console.log(`${emailInput}`);

            createUserWithEmailAndPassword(auth, emailInput, passwordInput);

            // app.state.isLoggedIn = true;

            // app.router.go(`/`);

        });

        this.querySelector("#login-btn").addEventListener("click", event => {

            app.router.go(`/login`);

        });

    }

}

// Registering the registration-page custom element
customElements.define("registration-page", RegistrationPage);