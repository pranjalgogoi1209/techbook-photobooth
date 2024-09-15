import html2canvas from "html2canvas";

const getScreenshot = (element, callback) => {
  if (!element) return;

  // flip the model
  const modelElement = element.querySelector(".modelContainer");
  if (modelElement) {
    // videoElement.classList.add("my-camera-custom-class");
    modelElement.style.right = modelElement.style.left;
    console.log(modelElement.style.right);
    modelElement.style.left = "";
  }

  // flip the image
  // element.style.transform = "scaleX(-1)";

  html2canvas(element, { useCORS: true }).then((canvas) => {
    const base64Image = canvas.toDataURL("image/png");
    callback(base64Image);
  });
};

export default getScreenshot;
