export default class SuccesfullyRegistered extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("successfully-registered");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);

    setTimeout(() => {
      app.state.isLoggedIn = true;
      app.router.go(`/main-page`);
    }, 3000);
  }
}

// Registering the login-page custom element
customElements.define("successfully-registered", SuccesfullyRegistered);
