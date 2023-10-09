export default class MainClientPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("main-client-page");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);
    console.log("lefleet library goes in here");

    this.querySelector("#btn-click-report-incident").addEventListener(
      "click",
      () => {
        app.router.go("/report-incident");
      }
    );
  }
}

// Registering the login-page custom element
customElements.define("main-client-page", MainClientPage);
