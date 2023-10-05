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

        this.querySelector("#register-btn").addEventListener("click", event => {

            app.state.isLoggedIn = true;

            app.router.go(`/`);

        });

        this.querySelector("#login-btn").addEventListener("click", event => {

            app.router.go(`/login`);

        });

    }

}

// Registering the registration-page custom element
customElements.define("registration-page", RegistrationPage);