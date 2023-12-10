import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from '../src/images/marker-icon.png';
import currentLocationIcon from '../src/current-location-marker.png';
import incidentSpotMarker from '../src/incident-spot-marker.png';
import markerIcon2x from '../src/images/marker-icon-2x.png';
import markerShadow from '../src/images/marker-shadow.png';
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
	onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import viteLogo from '../src/vite.svg';
import ttlogo from '../src/ttlogo.png';
import ttLogo from '../src/tt-logo.svg';

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

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				// HIDDING SPINNER
				document.getElementById('spinner-car').style.display = 'none';
				// Succuss Callback Code:

				// Destructuring latitude and longitude from position.coords object
				const { latitude } = position.coords;
				const { longitude } = position.coords;
				const coordinates = [latitude, longitude];

				// Leaflet Code - Start
				// Rendering map centered on a current user location (coordinates) with max zoom-in setting

				this.map = L.map('map').setView(coordinates, 18);

				// Original Tile
				const originalTile =
					'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

				// Mapbox Monochrome
				const monochrome = `https://api.mapbox.com/styles/v1/stormymayday/${import.meta.env.VITE_MAPBOX_STYLE
					}/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
					}`;

				// Tilelayer
				L.tileLayer(monochrome, {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				}).addTo(this.map);

				// Original Icon
				// let leafletIcon = L.icon({
				// 	iconUrl: markerIcon,
				// 	iconRetinaUrl: markerIcon2x,
				// 	iconSize: [25, 41],
				// 	iconAnchor: [12, 41],
				// 	popupAnchor: [1, -34],
				// 	shadowUrl: markerShadow,
				// 	shadowSize: [41, 41],
				// 	shadowAnchor: [12, 41]
				// });

				let leafletIcon = L.icon({
					iconUrl: currentLocationIcon,
					iconRetinaUrl: currentLocationIcon,
					iconSize: [130, 130],
					iconAnchor: [65, 80],
					popupAnchor: [1, -34],
				});

				// Displaying a Marker with current user coordinates
				L.marker(coordinates, { icon: leafletIcon })
					.addTo(this.map)
					.bindPopup(
						L.popup({
							autoClose: false,
							closeOnClick: false,
							className: 'running-popup',
						}),
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
			},
			() => {
				// Error Callback Code:

				alert(
					`Unfortunately, TowTackle was not able to pick up your position.`,
				);
			},
		);

		// }
	};

	renderMarkers() {
		if (this.activeCases.length > 0) {
			// Clear existing markers from the map
			this.map.eachLayer((layer) => {
				if (layer instanceof L.Marker) {
					this.map.removeLayer(layer);
				}
			});

			navigator.geolocation.getCurrentPosition(
				async (position) => {
					// HIDDING SPINNER
					document.getElementById('spinner-car').style.display = 'none';
					// Succuss Callback Code:

					// Destructuring latitude and longitude from position.coords object
					const { latitude } = position.coords;
					const { longitude } = position.coords;
					const coordinates = [latitude, longitude];

					let leafletIcon = L.icon({
						iconUrl: currentLocationIcon,
						iconRetinaUrl: currentLocationIcon,
						iconSize: [130, 130],
						iconAnchor: [65, 80],
						popupAnchor: [1, -34],
					});

					// Displaying a Marker with current user coordinates
					L.marker(coordinates, { icon: leafletIcon })
						.addTo(this.map)
						.bindPopup(
							L.popup({
								autoClose: false,
								closeOnClick: false,
								className: 'running-popup',
							}),
						)
						.setPopupContent('You are currently here')
						.openPopup();

					try {
						// await this.getActiveCases();
						// this.renderCaseCards();
						// this.renderMarkers();
					} catch (error) {
						console.error(error);
					}
					// Leaflet Code - End
				},
				() => {
					// Error Callback Code:

					// HIDDING SPINNER
					document.getElementById('spinner-car').style.display = 'none';

					alert(
						`Unfortunately, TowTackle was not able to pick up your position.`,
					);
				},
			);

			this.activeCases.forEach((activeCase) => {
				// console.log(activeCase);

				const { latitude, longitude } = activeCase.data.coordinates;

				let incidentMarker = {};

				// let leafletIcon = L.icon({
				// 	iconUrl: markerIcon,
				// 	iconRetinaUrl: markerIcon2x,
				// 	iconSize: [25, 41],
				// 	iconAnchor: [12, 41],
				// 	popupAnchor: [1, -34],
				// 	shadowUrl: markerShadow,
				// 	// shadowRetinaUrl: 'marker-shadow-2x.png',
				// 	shadowSize: [41, 41],
				// 	shadowAnchor: [12, 41]
				// });

				let leafletIcon = L.icon({
					iconUrl: incidentSpotMarker,
					iconRetinaUrl: incidentSpotMarker,
					iconSize: [50, 82],
					iconAnchor: [24, 70],
					popupAnchor: [1, -34],
				});

				// Creating Markers on the Map
				incidentMarker = L.marker([latitude, longitude], { icon: leafletIcon })
					.addTo(this.map)
					.bindPopup(
						L.popup({
							autoClose: false,
							closeOnClick: false,
							className: 'running-popup',
						}),
					)
					.setPopupContent(activeCase.data.notes);
				// .openPopup();
			});
		} else {
			console.log(`There are no active cases`);
		}
	}
	// end of renderMarkers

	async getActiveCases() {
		// Clear activeCases from local storage
		localStorage.removeItem('activeCases');

		this.activeCases = [];

		const user = JSON.parse(localStorage.getItem('user'));

		// Reference to the Firestore collection
		const casesCollection = collection(dataBase, 'cases');

		const myQuery = query(
			collection(dataBase, 'cases'),
			where('reporterId', '==', this.user.uid),
			where('status', 'in', ['active', 'in-progress', 'complete']),
		);

		// Listen to changes in the filtered collection
		const unsubscribe = onSnapshot(myQuery, (snapshot) => {
			// Clear the activeCases array before adding new data
			this.activeCases = [];

			snapshot.docChanges().forEach((change) => {
				if (change.type === 'modified') {
					console.log('Modified document:', change.doc.data());

					let message;

					if (change.doc.data().status === 'active') {
						message = 'Your case is now active!';

						console.log(`Notification: Status is ACTIVE!`);
					}

					if (change.doc.data().status === 'in-progress') {
						message = 'Your case has been accepted!';

						console.log(`Notification: Status is IN-PROGRESS!`);
					}

					if (change.doc.data().status === 'complete') {
						message = 'Your case has been completed!';

						console.log(`Notification: Status is COMPLETED!`);
					}

					// Handle modified document
					const title = 'TowTackle';
					const options = {
						body: message,
						icon: ttLogo,
					};

					this.sendNotification(title, options);
				}
			});

			snapshot.forEach((doc) => {

				const activeCase = {
					id: doc.id,
					data: doc.data(),
				};

				if (activeCase.data.status !== 'complete') {
					this.activeCases.push(activeCase);
				}

				const { latitude, longitude } = doc.data().coordinates;
				const coordinates = [latitude, longitude];
				localStorage.setItem('activeCases', JSON.stringify(this.activeCases));

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
				Notification.requestPermission().then((permission) => {
					if (permission === 'granted') {
						console.log(
							'Notification permission granted. Showing notification.',
						);
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
		if (document.querySelector('.case-container')) {
			document.querySelector('.case-container').innerHTML = '';
		}
		if (document.querySelector('.no-cases')) {
			document.querySelector('.no-cases').innerHTML = '';
		}

		if (this.activeCases.length > 0) {
			if (document.querySelector('.no-cases')) {
				document.querySelector('.no-cases').style.height = '0%';
			}

			if (document.querySelector('.case-container')) {
				document.querySelector('.case-container').style.height = '100%';

				document.querySelector('.case-container').innerHTML = `
				<h2 class="case-container-heading">Reported Incidents</h2>
			`;
			}

			// document.querySelector('.no-cases').style.height = '0%';
			// document.querySelector('.case-container').style.height = '100%';

			// document.querySelector('.case-container').innerHTML = `
			// 	<h2 class="case-container-heading">Reported Incidents</h2>
			// `;

			const content = this.activeCases
				.map((activeCase) => {
					const id = activeCase.id;
					const { image, notes, status, address, creationTime } =
						activeCase.data;
					// const { seconds } = creationTime.seconds;

					// console.log(activeCase.data.creationTime);

					const date = new Date(activeCase.data.creationTime.seconds * 1000);
					// const date = new Date(creationTime.seconds * 1000);
					// const date = new Date(seconds * 1000);

					// Month name array
					const monthNames = [
						'January',
						'February',
						'March',
						'April',
						'May',
						'June',
						'July',
						'August',
						'September',
						'October',
						'November',
						'December',
					];

					// Get month, day, year, hour, and minute
					const month = monthNames[date.getMonth()];
					const day = date.getDate();
					const year = date.getFullYear();
					let hour = date.getHours();
					const minute = date.getMinutes();
					const period = hour >= 12 ? 'PM' : 'AM';

					// Convert hour to 12-hour format
					hour = hour % 12 || 12;

					// Create the formatted date string
					const formattedDate = `${month} ${day}, ${year}, ${hour}:${minute.toLocaleString(
						'en-US',
						{ minimumIntegerDigits: 2 },
					)} ${period}`;

					return `
					<div class="case-item">
                        <div class="case-img-container">
                            <img src=${image} alt="" />
                        </div>
                        <div class="case-info">
                            <div>
                                <span class="new-request">${status}</span>
                            </div>
                            <h3 class="case-notes">${notes}</h3>
                            <p class="date-text">${formattedDate}</p>
                            <div class="container-user-case-view-incident">
								<p id=${id} class="case-btn">VIEW INCIDENT<i class="right-icon-arrow-view-case"></i></p>
							</div>
                        </div>
                    </div>
				`;
				})
				.join('');

			this.querySelector('.case-container').innerHTML += content;

			if (document.querySelector('.case-container')) {
				document.querySelector('.case-container').innerHTML += `
				<button id="report-new-incident-btn" class="button-primary-simple-black fat">Report New Incident</button>
			`;
			}

			// document.querySelector('.case-container').innerHTML += `
			// 	<button id="report-new-incident-btn" class="button-primary-simple-black fat">Report New Incident</button>
			// `;

			if (document.querySelector('#report-new-incident-btn')) {
				document
					.querySelector('#report-new-incident-btn')
					.addEventListener('click', () => {
						app.router.go('/report-incident');
					});
			}

			// document.querySelector('#report-new-incident-btn').addEventListener(

			// 	'click',
			// 	() => {

			// 		app.router.go('/report-incident');
			// 	},

			// );

			// Selecting all 'View Incident' buttons and attaching an event listener
			const viewCaseButtons = this.querySelectorAll('.case-btn');

			viewCaseButtons.forEach((caseButton) => {
				caseButton.addEventListener('click', () => {
					console.log(
						`You clicked on a case button with an id of ${caseButton.id} `,
					);

					// Setting Local Storage here
					const storedCases = JSON.parse(localStorage.getItem('activeCases'));

					const filteredCase = storedCases.filter((item) => {
						return caseButton.id == item.id;
					});

					localStorage.setItem('currentCase', JSON.stringify(filteredCase[0]));

					Router.go('/case');
				});
			});
		} else {
			// console.log(`There are no active cases`);

			// Clearing the Info Section
			// Clearing
			// document.querySelector('.case-container').innerHTML = ''
			// document.querySelector('.no-cases').innerHTML = '';

			if (document.querySelector('.no-cases')) {
				document.querySelector('.no-cases').innerHTML = `
				
				<div class="rounded-img-bg">
          			<div class="rounded-img-container"></div>
        		</div>

        		<h3>Report Wrongly parked vehicle near you</h3>

				<p>
					Use Towtackle app to effortlessly capture or upload images of wrongly parked vehicles. Add vehicle
				details and include the location for efficient tow truck dispatch.
				</p>

        		<button id="btn-click-report-incident" class="button-primary-simple-black fat">Report incident</button>

				<div class="bottom-footer-man-page">
					<i class="help-icon"></i><span>HELP</span>
				</div>
			`;
			}

			if (document.querySelector('.case-container')) {
				document.querySelector('.case-container').style.height = '0%';
			}

			if (document.querySelector('.no-cases')) {
				document.querySelector('.no-cases').style.height = '100%';
			}

			// document.querySelector('.case-container').style.height = '0%';
			// document.querySelector('.no-cases').style.height = '100%';

			if (document.querySelector('#btn-click-report-incident')) {
				document
					.querySelector('#btn-click-report-incident')
					.addEventListener('click', () => {
						app.router.go('/report-incident');
					});
			}

			// document.querySelector('#btn-click-report-incident').addEventListener(

			// 	'click',
			// 	() => {
			// 		app.router.go('/report-incident');
			// 	},

			// );
		}
	}
	// end of renderCaseCards

	connectedCallback() {

		if (!navigator.onLine) {

			Router.go('/offline');

		}

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
			document.querySelector('#user-name').innerHTML =
				this.user.nameRegistration;
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

		this.querySelector('#logout-btn').addEventListener('click', async () => {
			localStorage.clear();

			await this.logOut();
		});
	}
}

// Registering the login-page custom element
customElements.define('main-client-page', MainClientPage);
