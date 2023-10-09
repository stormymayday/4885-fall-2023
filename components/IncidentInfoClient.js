export default class IncidentInfoClient extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("incident-info");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);
  }
}

// Registering the login-page custom element
customElements.define("incident-info", IncidentInfoClient);
