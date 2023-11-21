export default class OfflinePage extends HTMLElement {

    constructor() {

        super();

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById("offline-page-template");

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);
    }
}

// Registering the home-page custom element
customElements.define("offline-page", OfflinePage);
