export default class ReportIncidentClient extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const template = document.getElementById("report-incident-client");
    const content = template.content.cloneNode(true);
    this.appendChild(content);

    const fileInput = this.querySelector("#fileInput");
    const uploadedImage = this.querySelector("#uploadedImage");
    const uploadButton = this.querySelector("#uploadButton");
    const uploadMoreButton = this.querySelector("#uploadMoreButton");
    const captureButton = this.querySelector("#captureButton");

    let stream; // Store the stream globally

    captureButton.addEventListener("click", function () {
      const constraints = { video: true };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (s) {
          stream = s; // Store the stream
          const video = document.createElement("video");
          uploadedImage.parentElement.appendChild(video);

          video.srcObject = stream;
          video.play();

          video.addEventListener("click", function () {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataURL = canvas.toDataURL("image/png");
            uploadedImage.src = dataURL;
            uploadButton.style.display = "none";
            uploadMoreButton.style.display = "block";

            // Upload img to firebase so we can pass to leaflet

            // Turn off the camera
            stream.getTracks().forEach((track) => track.stop());
          });
        })
        .catch(function (error) {
          console.error("Error accessing the camera:", error);
        });
    });

    // DISPLAY IMGS ( HAVE to CREATE A GALERY To DISPLAY IMGS)

    // fileInput.addEventListener("change", function () {
    //   const file = this.files[0];
    //   const reader = new FileReader();

    //   reader.onload = function (e) {
    //     uploadedImage.src = e.target.result;
    //     uploadButton.style.display = "none";
    //     uploadMoreButton.style.display = "block";

    //     // Upload img to firebase so we can pass to leaflet
    //   };
    //   reader.readAsDataURL(file);
    // });

    this.querySelector("#btn-click-go-to-incident-info").addEventListener(
      "click",
      () => {
        app.router.go("/incident-info");
      }
    );
  }
}

customElements.define("report-incident-client", ReportIncidentClient);
