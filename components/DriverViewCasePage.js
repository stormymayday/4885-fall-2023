// import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Router from "../services/Router.js";
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export default class DriverViewCasePage extends HTMLElement {

    constructor() {

        super();

        this.currentCase = null;

        this.map;

        this.driverMaker = {};
        this.incidentMarker = {};

        this.driverCoordinates;

        this.caseLatitude;
        this.caseLongitude;
        this.caseNotes;

        this.leafletRoutingControl;

    }

    getCurrentCaseFromLocalStorage() {

        if (JSON.parse(localStorage.getItem("currentCase"))) {

            this.currentCase = JSON.parse(localStorage.getItem("currentCase"));

            this.caseLatitude = this.currentCase.data.coordinates.latitude;
            this.caseLongitude = this.currentCase.data.coordinates.longitude;
            this.caseNotes = this.currentCase.data.notes;

        }

    }

    setDriverCoordinates() {

        navigator.geolocation.getCurrentPosition((position) => {

            // Succuss Callback Code:

            // Destructuring latitude and longitude from position.coords object
            const { latitude } = position.coords;
            const { longitude } = position.coords;

            this.driverCoordinates = [latitude, longitude];

            if (!this.map) {
                this.displayMap();
            }

            if (this.leafletRoutingControl) {
                this.map.removeControl(this.leafletRoutingControl);
            }

            this.setCurrentDriverPositionMarker();

            this.setCaseMarker();

            this.renderCaseDetails();


        }, () => {

            // Error Callback Code:
            alert(`Unfortunately, TowTackle was not able to pick up your position.`);

        });

    }

    displayMap() {

        // this.map = L.map('map').setView([this.driverLongitude, this.driverLatitude], 18);
        this.map = L.map('map').setView(this.driverCoordinates, 18);

        // Original Tile
        const originalTile = 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

        // Stadia_AlidadeSmooth Tile
        const Stadia_AlidadeSmooth = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';

        // Tilelayer
        L.tileLayer(Stadia_AlidadeSmooth, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

    }

    setCurrentDriverPositionMarker() {

        if (this.map) {

            // Displaying a Marker with current user coordinates
            this.driverMaker = L.marker(this.driverCoordinates).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent('You are currently here')
                .openPopup();

        } else {
            console.log(`map is not initialized`);
        }

    }

    setCaseMarker() {

        if (this.map) {

            // Displaying Case marker
            this.incidentMarker = L.marker([this.caseLatitude, this.caseLongitude]).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent(this.caseNotes)
                .openPopup();

        } else {
            console.log(`map is not initialized`);
        }
    }

    renderCaseDetails() {

        if (this.currentCase) {

            const { id } = this.currentCase;
            const { image, notes, carMake, carModel, carType, carColor, licensePlate, address } = this.currentCase.data;

            const directionsContainer = document.getElementById('directions-container');
            directionsContainer.innerHTML = '';

            this.querySelector(".case-container").innerHTML = `
            <button id="back-btn">Back</button>
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
        `;

        }

        this.querySelector("#back-btn").addEventListener("click", async (event) => {

            Router.go(`/main-page`);

        });

        this.querySelector("#accept-case").addEventListener("click", async (event) => {

            console.log('Accepting Case');

            // Changing status to 'in-progress'
            const caseRef = doc(dataBase, "cases", this.currentCase.id);
            await updateDoc(caseRef, {
                status: 'in-progress',

            });

            this.renderAcceptCaseUI();

        });

    }
    // renderCaseDetails - End

    renderAcceptCaseUI() {

        // Clearing Markers
        this.map.removeLayer(this.driverMaker);
        this.map.removeLayer(this.incidentMarker);

        // Create a control and add it to the map
        this.leafletRoutingControl = L.Routing.control({
            waypoints: [
                L.latLng(this.driverCoordinates[0], this.driverCoordinates[1]),
                L.latLng(this.caseLatitude, this.caseLongitude)
            ],
            routeWhileDragging: true
        });

        this.leafletRoutingControl.addTo(this.map);

        // Listen for the "routesfound" event
        this.leafletRoutingControl.on('routesfound', (e) => {
            const routes = e.routes; // Get the array of routes
            if (routes.length > 0) {
                // Extract and display directions data from the first route
                const directions = routes[0].instructions;
                displayDirections(directions, routes);
            }
        });

        function displayDirections(directions, routes) {

            const directionsContainer = document.getElementById('directions-container');
            directionsContainer.innerHTML = ''; // Clear previous directions

            // Current Street
            const currentStreet = `Current Street: ${routes[0].instructions[0].road}`;
            const currentStreetHeader = document.createElement('h4');
            currentStreetHeader.innerHTML = currentStreet;
            directionsContainer.appendChild(currentStreetHeader);

            // Destination Street
            const destinationStreet = `Destination Street: ${routes[0].instructions[routes[0].instructions.length - 1].road}`;
            const destinationStreetHeader = document.createElement('h4');
            destinationStreetHeader.innerHTML = destinationStreet;
            directionsContainer.appendChild(destinationStreetHeader);

            // Total Distance in km
            const totalDistance = `${(routes[0].summary.totalDistance / 1000).toFixed(2)} km`;
            const distanceHeader = document.createElement('h4');
            distanceHeader.innerHTML = totalDistance;
            directionsContainer.appendChild(distanceHeader);

            // Checking total distance
            if (routes[0].summary.totalDistance / 1000 > 0.01) {
                document.getElementById("complete-case").disabled = true;
            } else {
                document.getElementById("complete-case").disabled = false;
            }
            console.log(routes[0].summary.totalDistance / 1000);

            // console.log(document.getElementById("cancel-case"));

            // Total Time in mins
            const totalTime = `${Math.round(routes[0].summary.totalTime / 60)} min`;
            const totalTimeHeader = document.createElement('h4');
            totalTimeHeader.innerHTML = totalTime;
            directionsContainer.appendChild(totalTimeHeader);

            // Current Time
            let date = new Date();
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let am_pm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            const currentTime = `${hours}:${minutes} ${am_pm}`;
            const currentTimeHeader = document.createElement('h4');
            currentTimeHeader.innerHTML = currentTime;
            directionsContainer.appendChild(currentTimeHeader);

            // Current Instruction
            const currentInstruction = `${routes[0].instructions[0].text} ${Math.round(routes[0].instructions[0].distance)} m`;
            const currentInstructionDiv = document.createElement('div');
            currentInstructionDiv.innerHTML = currentInstruction;
            directionsContainer.appendChild(currentInstructionDiv);

            // All Instructions (DO NOT DELETE)
            // directions.forEach((step, index) => {
            //     const instruction = step.text;
            //     const distance = step.distance;
            //     // With Index:
            //     // const formattedStep = `${index + 1}. ${instruction} ${Math.round(distance)} m`;
            //     // Without Index
            //     const formattedStep = `${instruction} ${Math.round(distance)} m`;
            //     const stepElement = document.createElement('div');
            //     stepElement.textContent = formattedStep;
            //     directionsContainer.appendChild(stepElement);

            //     // Log the step object to inspect its structure
            //     console.log(step);
            // });
        }

        this.querySelector(".case-container").innerHTML = `
            <button id="cancel-case">Cancel</button>
            <button id="complete-case">Complete</button>
        `;

        this.querySelector("#cancel-case").addEventListener("click", async (event) => {

            console.log('Cancelling Case');

            // Changing case status to 'active'
            const caseRef = doc(dataBase, "cases", this.currentCase.id);
            await updateDoc(caseRef, {
                status: 'active',

            });

            this.setDriverCoordinates();

        });

        this.querySelector("#complete-case").addEventListener("click", async (event) => {

            // Should be conditionally disabled 
            // Based on distance

            // Some Popup 'Are you sure'?

            // Changing case status to 'complete'
            const caseRef = doc(dataBase, "cases", this.currentCase.id);
            await updateDoc(caseRef, {
                status: 'complete',

            });

            // Route to main page
            Router.go(`/main-page`);

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

            this.getCurrentCaseFromLocalStorage();

            // This function kicks-off most displayMap, displayMarkers
            this.setDriverCoordinates();

        }

        this.querySelector("#logout-btn").addEventListener("click", async (event) => {

            localStorage.clear();

            await this.logOut();

        });

    }

}

customElements.define("driver-view-case-page", DriverViewCasePage);