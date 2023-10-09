import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.js";

export default class LoginPage extends HTMLElement {

    constructor() {

        super();

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('login-page-template');

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);

        this.querySelector("#login-from").addEventListener("submit", event => {

            event.preventDefault();

            console.log(`hello from login`);

            // app.state.isLoggedIn = true;

            // app.router.go(`/`);

        });

        this.querySelector("#register-btn").addEventListener("click", event => {

            app.router.go(`/registration`);

        });

    }

}

// Registering the login-page custom element
customElements.define("login-page", LoginPage);