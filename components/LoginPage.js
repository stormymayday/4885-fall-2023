<<<<<<< HEAD
import { appPath, dataBase, auth } from "../services/firebase";
=======
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.js";
>>>>>>> 297d2232cfd10ed5c51bfe5ce586a76f56f498db

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

<<<<<<< HEAD
    this.querySelector("#register-btn").addEventListener("click", (event) => {
      app.router.go(`/registration`);
    });
=======
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
>>>>>>> 297d2232cfd10ed5c51bfe5ce586a76f56f498db

    this.querySelector("#test").addEventListener("click", () => {
      console.log(appPath, dataBase, auth);
    });
  }
}

// Registering the login-page custom element
customElements.define("login-page", LoginPage);
