import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.js";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
  validatePhone,
} from "../services/validationFunctions.js";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { dataBase } from "../services/firebase.js";

export default class RegistrationPage extends HTMLElement {
  constructor() {
    // Testing master push
    super();
  }

  registration = async () => {
    // async () => {
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
    const nameRegistration = document.querySelector("#name-registration").value;

    if (
      validateEmail(emailInput) &&
      validatePassword(passwordInput) &&
      validateName(nameRegistration) &&
      validateConfirmPassword(passwordInput, passwordConformation) &&
      validatePhone(phoneNumber)
    ) {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailInput,
        passwordInput
      );

      console.log(userCredential.user);

      try {
        await setDoc(doc(dataBase, "users", userCredential.user.uid), {
          emailInput,
          nameRegistration,
          phoneNumber,
          role: "user",
        });

        const userDocRef = doc(dataBase, "users", userCredential.user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const finale = userDocSnapshot.data();
        finale.uid = userCredential.user.uid;
        localStorage.setItem("user", JSON.stringify(finale));
      } catch (error) {
        console.error(error);
      }
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
  };

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("registration-page-template");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);
    // leo

    this.querySelector("#register-btn-registration").addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.registration();
        app.router.go("/registered");
      }
    );

    this.querySelector("#login-btn").addEventListener("click", (event) => {
      app.router.go(`/login`);
    });
  }
}

// Registering the registration-page custom element
customElements.define("registration-page", RegistrationPage);

console.log("leo");

// redo
