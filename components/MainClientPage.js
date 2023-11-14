import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from "../src/images/marker-icon.png";
import markerIcon2x from "../src/images/marker-icon-2x.png";
import markerShadow from "../src/images/marker-shadow.png";
import Router from '../services/Router.js';
import { signOut } from 'firebase/auth';
import { auth, dataBase, storage } from '../services/firebase.js';
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
	onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import viteLogo from '../src/vite.svg';

export default class MainClientPage extends HTMLElement {

	constructor() {

		super();

		this.user = JSON.parse(localStorage.getItem('user'));

		this.map = null;

		this.activeCases = [];

		// this.previousStatus = '';

		// this.coordinates = [];

		// this.userMarker = null;
	}

	async logOut() {

		await signOut(auth);

		app.router.go(`/login`);
	}

	displayMap = async () => {

		// Checking if map 'container' exists
		const container = L.DomUtil.get('map');
		if (container != null) {
			container._leaflet_id = null;
		}

		navigator.geolocation.getCurrentPosition(async (position) => {

			// Succuss Callback Code:

			// Destructuring latitude and longitude from position.coords object
			const { latitude } = position.coords;
			const { longitude } = position.coords;
			const coordinates = [latitude, longitude];

			// Leaflet Code - Start
			// Rendering map centered on a current user location (coordinates) with max zoom-in setting

			this.map = L.map('map').setView(coordinates, 18);

			// Original Tile
			const originalTile = 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

			// Mapbox Monochrome
			const monochrome = `https://api.mapbox.com/styles/v1/stormymayday/${import.meta.env.VITE_MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`;

			// Tilelayer
			L.tileLayer(monochrome, {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(this.map);

			let leafletIcon = L.icon({
				iconUrl: markerIcon,
				iconRetinaUrl: markerIcon2x,
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowUrl: markerShadow,
				// shadowRetinaUrl: 'marker-shadow-2x.png',
				shadowSize: [41, 41],
				shadowAnchor: [12, 41]
			});

			// Displaying a Marker with current user coordinates
			L.marker(coordinates, { icon: leafletIcon }).addTo(this.map)
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

				await this.getActiveCases();

				// this.renderCaseCards();

				// this.renderMarkers();

			} catch (error) {

				console.error(error);

			}
			// Leaflet Code - End

		}, () => {

			// Error Callback Code:

			alert(`Unfortunately, TowTackle was not able to pick up your position.`);

		});

		// }

	}

	renderMarkers() {

		if (this.activeCases.length > 0) {

			// Clear existing markers from the map
			this.map.eachLayer((layer) => {
				if (layer instanceof L.Marker) {
					this.map.removeLayer(layer);
				}
			});

			this.activeCases.forEach((activeCase) => {

				// console.log(activeCase);

				const { latitude, longitude } = activeCase.data.coordinates;

				let incidentMarker = {};

				let leafletIcon = L.icon({
					iconUrl: markerIcon,
					iconRetinaUrl: markerIcon2x,
					iconSize: [25, 41],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34],
					shadowUrl: markerShadow,
					// shadowRetinaUrl: 'marker-shadow-2x.png',
					shadowSize: [41, 41],
					shadowAnchor: [12, 41]
				});

				// Creating Markers on the Map
				incidentMarker = L.marker([latitude, longitude], { icon: leafletIcon }).addTo(this.map)
					.bindPopup(
						L.popup({
							autoClose: false,
							closeOnClick: false,
							className: 'running-popup',
						})
					)
					.setPopupContent(activeCase.data.notes)
					.openPopup();

			});

		} else {

			console.log(`There are no active cases`);

		}

	}
	// end of renderMarkers

	async getActiveCases() {

		// Clear activeCases from local storage
		localStorage.removeItem("activeCases");

		this.activeCases = [];

		const user = JSON.parse(localStorage.getItem('user'));

		// Reference to the Firestore collection
		const casesCollection = collection(dataBase, "cases");

		const myQuery = query(
			collection(dataBase, 'cases'),
			where('reporterId', '==', this.user.uid),
			where('status', 'in', ['active', 'in-progress', 'complete'])
		);

		// Listen to changes in the filtered collection
		const unsubscribe = onSnapshot(myQuery, (snapshot) => {

			// Clear the activeCases array before adding new data
			this.activeCases = [];

			snapshot.docChanges().forEach((change) => {

				if (change.type === 'modified') {

					console.log('Modified document:', change.doc.data());

					let message;

					if (change.doc.data().status === "active") {

						message = 'Your case has been cancelled!';

					}

					if (change.doc.data().status === "in-progress") {

						message = 'Your case has been accepted!';

					}

					if (change.doc.data().status === "complete") {

						message = 'Your case has been completed!';

					}

					// Handle modified document
					const title = 'TowTackle';
					const options = {
						body: message,
						icon: viteLogo,
					};

					this.sendNotification(title, options);

				}

			});

			snapshot.forEach((doc) => {

				const activeCase = {
					id: doc.id,
					data: doc.data()
				};

				this.activeCases.push(activeCase);

				const { latitude, longitude } = doc.data().coordinates;
				const coordinates = [latitude, longitude];
				localStorage.setItem("activeCases", JSON.stringify(this.activeCases));

			});

			this.renderCaseCards();
			this.renderMarkers();

			// console.log(this.activeCases);

			console.log(`re-fetching`);

		});
	}

	sendNotification(title, options) {
		if ('Notification' in window) {
			if (Notification.permission === 'granted') {
				console.log('Notification permission granted. Showing notification.');
				new Notification(title, options);
			} else if (Notification.permission !== 'denied') {
				console.log('Requesting notification permission.');
				Notification.requestPermission().then(permission => {
					if (permission === 'granted') {
						console.log('Notification permission granted. Showing notification.');
						new Notification(title, options);
					} else {
						console.log('Notification permission denied.');
					}
				});
			} else {
				console.log('Notification permission denied.');
			}
		} else {
			console.log('Notification API is not supported in this browser.');
		}
	}


	renderCaseCards() {

		// Clearing
		this.querySelector('#user-cases-display').innerHTML = '';

		if (this.activeCases.length > 0) {

			const content = this.activeCases.map((activeCase) => {

				const id = activeCase.id;
				const { image, notes, status, address } = activeCase.data;
				const date = new Date(activeCase.data.creationTime.seconds * 1000);

				return `
					<div div class= "view-case">
						<div class="left-side-view-case">
							<div class="img-container-case">
								<img src="${image}" alt="">
							</div>
						</div>
						<div class="right-side-view-case">
							<p class="status-of-user-case">${status}</p>
							<p class="info-user-case"> ${address}</p>
							<p class="data-user-case">${date}</p>
							<div class="container-user-case-view-incident">
								<p id=${id} class="case-btn">VIEW INCIDENT<i class="right-icon-arrow-view-case"></i></p>
							</div>
						</div>
						</div>
					</div>
				`;


			}).join('');

			this.querySelector('#user-cases-display').innerHTML = content;

			// Selecting all 'View Incident' buttons and attaching an event listener
			const viewCaseButtons = this.querySelectorAll('.case-btn');

			viewCaseButtons.forEach(caseButton => {

				caseButton.addEventListener('click', () => {

					console.log(`You clicked on a case button with an id of ${caseButton.id} `);

					// Setting Local Storage here
					const storedCases = JSON.parse(localStorage.getItem("activeCases"));

					const filteredCase = storedCases.filter((item) => {

						return caseButton.id == item.id;

					});

					localStorage.setItem("currentCase", JSON.stringify(filteredCase[0]));

					Router.go('/case');

				});

			});

		} else {

			console.log(`There are no active cases`);

		}

	}
	// end of renderCaseCards

	connectedCallback() {

		// Check if the element already exists
		if (this.querySelector('#main-client-page')) {
			// Update the content or return early
			return;
		}

		// Getting template from the DOM
		const template = document.getElementById('main-client-page');

		// Cloning the template
		const content = template.content.cloneNode(true);

		// Appending content to the DOM
		this.appendChild(content);

		// const userObject = JSON.parse(localStorage.getItem("user"));
		// console.log(this.user);

		if (this.user) {

			document.querySelector('#user-name').innerHTML = this.user.nameRegistration;
			document.querySelector('#user-email').innerHTML = this.user.email;

			// Testing if navigator.geolocation is supported by the browser
			if (navigator.geolocation) {

				if (this.map) {

					console.log(`map exists`);

					this.getActiveCases();

					this.renderCaseCards();

					this.renderMarkers();

				} else {

					console.log(`map does not exist`);

					if (this.map) {
						console.log(`removing the map`);
						this.map.remove();
						console.log(`map removed`);
					}

					this.displayMap();

				}

			}
			// end of navigator / Leaflet
		}

		this.querySelector('#btn-click-report-incident').addEventListener(

			'click',
			() => {
				// console.log('hahah');
				app.router.go('/report-incident');
			},

		);

		this.querySelector('#logout-btn').addEventListener('click', async () => {

			localStorage.clear();

			await this.logOut();

		});
	}
}

// Registering the login-page custom element
customElements.define('main-client-page', MainClientPage);
