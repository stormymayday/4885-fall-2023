export default class StarterPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Getting template from the DOM
    const template = document.getElementById("starter-page");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    console.log(this);
    this.appendChild(content);

    this.querySelector("#login-btn").addEventListener("click", (event) => {
      event.preventDefault();

      app.router.go(`/login`);
    });
    this.querySelector("#register-btn").addEventListener("click", (event) => {
      event.preventDefault();

      app.router.go(`/registration`);
    });
  }
}

// Registering the home-page custom element
customElements.define("starter-page", StarterPage);

// TO DO -
// Registration LINK
// DELETE LOGIN APPLE | GOOGLE | FB
