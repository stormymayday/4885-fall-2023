import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, dataBase, appPath } from "../services/firebase.js";
import { setDoc, doc, getDocs } from "firebase/firestore";
import {
  validateEmail,
  validatePassword,
} from "../services/validationFunctions.js";

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

    this.querySelector("#login-from").addEventListener("submit", (event) => {
      event.preventDefault();

      console.log(this);

      // **************************************** FIREBASE EMAIL AND PASSWORD VALIDATION */

      // Get user email and login

      const password = this.querySelector("#password-login").value;
      const email = this.querySelector("#username-email").value;

      if (
        validatePassword(this.querySelector("#password-login").value) &&
        validateEmail(this.querySelector("#username-email").value)
      ) {
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            const userUID = user.uid;

            // ...
            const userDataJSON = JSON.stringify(user);
            localStorage.setItem("userData", userDataJSON);

            // const useObject = JSON.parse(localStorage.getItem("userData"));
            // console.log(useObject);
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
          });
      } else if (
        validatePassword(this.querySelector("#password-login").value) &&
        !validateEmail(this.querySelector("#username-email").value)
      ) {
        console.log("your email is not valide");
      } else if (
        !validatePassword(this.querySelector("#password-login").value) &&
        validateEmail(this.querySelector("#username-email").value)
      ) {
        console.log("Yor password is not valide");
      } else {
        console.log("both are incorect");
      }

      app.state.isLoggedIn = true;

      app.router.go(`/main-page`);
    });

    this.querySelector("#register-btn").addEventListener("click", (event) => {
      event.preventDefault();

      app.router.go(`/registration`);
    });

    this.querySelector("#back-btn").addEventListener("click", (event) => {
      event.preventDefault();
      app.router.go("/");
    });
  }
}

// Registering the login-page custom element
customElements.define("login-page", LoginPage);
