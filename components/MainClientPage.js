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

    const useObject = JSON.parse(localStorage.getItem("userData"));
    console.log(useObject);

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
// TODO ADD LEAFLEET
// Side bar opens if you click on a pin(Delete or change a report)

// Fetch all incidents (Make available to see only thouse that the client has submmited)
// Drop down menu out of the photo on the right top corner(SETTINGS LOGOUT)
// Left top corner logo (LINK to te main page => APP.ROUTER.GO(/main-page))
