import { appPath, dataBase, auth } from "../services/firebase";

export default class LoginPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("login-page-template");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);

    this.querySelector("#login-btn").addEventListener("click", (event) => {
      app.state.isLoggedIn = true;

      app.router.go(`/`);
    });

    this.querySelector("#register-btn").addEventListener("click", (event) => {
      app.router.go(`/registration`);
    });

    this.querySelector("#test").addEventListener("click", () => {
      console.log(appPath, dataBase, auth);
    });
  }
}

// Registering the login-page custom element
customElements.define("login-page", LoginPage);
