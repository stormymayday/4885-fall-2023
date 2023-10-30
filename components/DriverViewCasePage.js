// import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Router from "../services/Router.js";
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export default class DriverViewCasePage extends HTMLElement {

    constructor() {

        super();

        this.currentCase = null;

        this.map;

    }

    displayMap = async () => {

        navigator.geolocation.getCurrentPosition(async (position) => {

            this.getCurrentCaseFromLocalStorage();

            console.log(this.currentCase);

            // Succuss Callback Code:

            // Destructuring latitude and longitude from position.coords object
            const { latitude } = position.coords;
            const { longitude } = position.coords;
            const coordinates = [latitude, longitude];

            // Leaflet Code - Start
            // Rendering map centered on a current user location (coordinates) with max zoom-in setting
            // this.map = L.map('map').setView(coordinates, 18);
            this.map = L.map('map').setView(coordinates, 18);

            // Tilelayer
            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            // Displaying a Marker with current user coordinates
            // L.marker(coordinates).addTo(this.map)
            //     .bindPopup(
            //         L.popup({
            //             autoClose: false,
            //             closeOnClick: false,
            //             className: 'running-popup',
            //         })
            //     )
            //     .setPopupContent('You are currently here')
            //     .openPopup();

            // Leaflet Code - End

            this.renderCaseDetails();

            let incidentMarker = {};
            let latitude1 = this.currentCase.data.coordinates.latitude;
            let longitude1 = this.currentCase.data.coordinates.longitude;
            let notes = this.currentCase.data.notes;
            // incidentMarker = L.marker([latitude1, longitude1]).addTo(this.map)
            //     .bindPopup(
            //         L.popup({
            //             autoClose: false,
            //             closeOnClick: false,
            //             className: 'running-popup',
            //         })
            //     )
            //     .setPopupContent(notes)
            //     .openPopup();

            L.Routing.control({
                waypoints: [
                    L.latLng(latitude, longitude),
                    L.latLng(latitude1, longitude1)
                ],
                routeWhileDragging: true
            }).addTo(this.map);

        }, () => {

            // Error Callback Code:

            alert(`Unfortunately, TowTackle was not able to pick up your position.`);

        });

    }

    getCurrentCaseFromLocalStorage() {

        if (JSON.parse(localStorage.getItem("currentCase"))) {

            this.currentCase = JSON.parse(localStorage.getItem("currentCase"));

        }

    }

    renderCaseDetails() {

        if (this.currentCase) {

            const { id } = this.currentCase;
            const { image, notes, carMake, carModel, carType, carColor, licensePlate, address } = this.currentCase.data;

            this.querySelector(".case-container").innerHTML = `
        
            <h3>${notes}<h3>
            <div class="case-img-container">
                <img src=${image} alt="" style="width:150px" />
            </div>
            <div class="vehicle-details">
                <h4>vehicle details</h4>
                <p>Make: ${carMake}</p>
                <p>Car Type: ${carType}</p>
                <p>Color: ${carColor}</p>
                <p>License Plage: ${licensePlate}</p>
                <p>Address: ${address}</p>
            </div>
            <button id="accept-case">Accept</button>
            <button id="cancel-case">Cancel</button>
            <button id="complete-case">Complete</button>
        `;

        }

        this.querySelector("#accept-case").addEventListener("click", async (event) => {


            console.log('Accepting Case');

        });

        this.querySelector("#cancel-case").addEventListener("click", async (event) => {


            console.log('Cancelling Case');

        });

        this.querySelector("#complete-case").addEventListener("click", async (event) => {


            console.log('Completing Case');

        });


    }

    async logOut() {

        await signOut(auth);

        Router.go(`/login`);

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('driver-view-case-page-template');

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);

        const user = JSON.parse(localStorage.getItem('user'));
        const userRole = JSON.parse(localStorage.getItem('userRole'));

        if (user) {

            this.querySelector('h2').innerHTML = `Welcome ${user.email}`;
            this.querySelector('h3').innerHTML = `Welcome ${userRole}`;

            // Testing if navigator.geolocation is supported by the browser
            if (navigator.geolocation) {

                this.displayMap();



            }
            // end of navigator / Leaflet

        }

        this.querySelector("#back-btn").addEventListener("click", async (event) => {


            Router.go(`/main-page`);

        });

        this.querySelector("#logout-btn").addEventListener("click", async (event) => {

            localStorage.clear();

            await this.logOut();

        });

    }

}

customElements.define("driver-view-case-page", DriverViewCasePage);