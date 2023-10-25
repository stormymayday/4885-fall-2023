import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import Router from "../services/Router.js";
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";

export default class DriverDashboardPage extends HTMLElement {

    constructor() {

        super();

        this.map;

    }

    displayMap = async () => {

        navigator.geolocation.getCurrentPosition((position) => {

            // Succuss Callback Code:

            // Destructuring latitude and longitude from position.coords object
            const { latitude } = position.coords;
            const { longitude } = position.coords;
            const coordinates = [latitude, longitude];

            // Leaflet Code - Start
            // Rendering map centered on a current user location (coordinates) with max zoom-in setting
            this.map = L.map('map').setView(coordinates, 18);

            // Tilelayer
            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            // Displaying a Marker with current user coordinates
            L.marker(coordinates).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent('You are currently here')
                .openPopup();

            try {

                this.getActiveCases();

            } catch (error) {

                console.error(error);

            }
            // Leaflet Code - End

        }, () => {

            // Error Callback Code:

            alert(`Unfortunately, TowTackle was not able to pick up your position.`);

        });

    }

    getActiveCases = async () => {

        const user = JSON.parse(localStorage.getItem('user'));

        const q = query(collection(dataBase, "cases"), where("status", "==", 'active'));

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {

            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());

            const { latitude, longitude } = doc.data().coordinates;

            const coordinates = [latitude, longitude];

            let incidentMarker = {};

            incidentMarker = L.marker([latitude, longitude]).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent(doc.data().notes)
                .openPopup();

        });

    }

    async logOut() {

        await signOut(auth);

        Router.go(`/login`);

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('driver-dashboard-page-template');

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

        this.querySelector("#logout-btn").addEventListener("click", async (event) => {

            localStorage.clear();

            await this.logOut();

        });

    }

}

customElements.define("driver-dashboard-page", DriverDashboardPage);