import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.js";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
  validatePhone,
} from "../services/validationFunctions.js";

export default class RegistrationPage extends HTMLElement {
  constructor() {
    // Testing master push
    super();
  }

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("registration-page-template");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);

    this.querySelector("#register-btn").addEventListener("click", (event) => {
      event.preventDefault();
      const passwordInput = document.querySelector(
        "#password-registration"
      ).value;
      const emailInput = document.querySelector("#email-registration").value;
      const passwordConformation = document.querySelector(
        "#confirmPassword-registration"
      ).value;
      const phoneNumber = document.querySelector(
        "#phoneNumber-registration"
      ).value;
      const nameRegistration =
        document.querySelector("#name-registration").value;

      if (
        validateEmail(emailInput) &&
        validatePassword(passwordInput) &&
        validateName(nameRegistration) &&
        validateConfirmPassword(passwordInput, passwordConformation) &&
        validatePhone(phoneNumber)
      ) {
        createUserWithEmailAndPassword(auth, emailInput, passwordInput)
          .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            const userUID = user.uid;

            // ...
            const userDataJSON = JSON.stringify(user);
            localStorage.setItem("userData", userDataJSON);
            app.router.go(`/registered`);
            app.state.isLoggedIn = true;

            // const useObject = JSON.parse(localStorage.getItem("userData"));
            // console.log(useObject);
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
          });
      }
      if (!validateEmail(emailInput)) {
        console.log("email is not valide");
      }
      if (!validatePassword(passwordInput)) {
        console.log("Password is not valide");
      }
      if (
        validatePassword(passwordInput) &&
        !validateConfirmPassword(passwordInput, passwordConformation)
      ) {
        console.log("conformation password is wrong");
      }
      if (!validateName(nameRegistration)) {
        console.log("Name is wrong");
      }
      if (!validatePhone(phoneNumber)) {
        console.log("phone number is wrong");
      }
    });

    this.querySelector("#login-btn").addEventListener("click", (event) => {
      app.router.go(`/login`);
    });
  }
}

// Registering the registration-page custom element
customElements.define("registration-page", RegistrationPage);

// TO DO
// CREATE A VALID REGISTRATION FORM
// Create user object and pass it to Firestore
// PASS user object to local storage
// Create registration validation
// BACK BTN => LOGIN
