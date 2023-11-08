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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default class MainClientPage extends HTMLElement {

	constructor() {

		super();

		this.user = JSON.parse(localStorage.getItem('user'));

		this.map;

		this.activeCases = [];
	}

	async logOut() {

		await signOut(auth);

		app.router.go(`/login`);
	}

	displayMap = async () => {

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

				this.renderCaseCards();

				this.renderMarkers();

			} catch (error) {

				console.error(error);

			}
			// Leaflet Code - End

		}, () => {

			// Error Callback Code:

			alert(`Unfortunately, TowTackle was not able to pick up your position.`);

		});

	}

	renderMarkers() {

		if (this.activeCases.length > 0) {

			this.activeCases.forEach((activeCase) => {

				console.log(activeCase);

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

	getActiveCases = async () => {

		const q = query(
			collection(dataBase, 'cases'),
			where('status', '==', 'active'),
			where('reporterId', '==', this.user.uid),
		);

		// console.log(this.user.uid);

		const querySnapshot = await getDocs(q);

		// this.activeCases = querySnapshot;

		querySnapshot.forEach((doc) => {


			let activeCase = {

				id: doc.id,
				data: doc.data()

			};

			this.activeCases.push(activeCase);

			const { latitude, longitude } = doc.data().coordinates;

			const coordinates = [latitude, longitude];

			localStorage.setItem("activeCases", JSON.stringify(this.activeCases));

		});


	};

	renderCaseCards() {

		if (this.activeCases.length > 0) {

			const content = this.activeCases.map((activeCase) => {

				const id = activeCase.id;
				const { image, notes, status, address } = activeCase.data;
				const date = new Date(activeCase.data.creationTime.seconds * 1000);

				return `
					<div div class= "view-case" >
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
		// Getting template from the DOM
		const template = document.getElementById('main-client-page');

		// Cloning the template
		const content = template.content.cloneNode(true);

		// Appending content to the DOM
		this.appendChild(content);

		// const userObject = JSON.parse(localStorage.getItem("user"));
		// console.log(this.user);

		if (this.user) {
			this.querySelector(
				'h3',
			).innerHTML = `Welcome ${this.user.role} ${this.user.nameRegistration} `;

			// Testing if navigator.geolocation is supported by the browser
			if (navigator.geolocation) {
				this.displayMap();
			}
			// end of navigator / Leaflet
		}

		this.querySelector('#btn-click-report-incident').addEventListener(

			'click',
			() => {
				console.log('hahah');
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
// TODO ADD LEAFLEET
// Side bar opens if you click on a pin(Delete or change a report)

// Fetch all incidents (Make available to see only thouse that the client has submmited)
// Drop down menu out of the photo on the right top corner(SETTINGS LOGOUT)
// Left top corner logo (LINK to te main page => APP.ROUTER.GO(/main-page))
