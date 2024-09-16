import html2canvas from "html2canvas";

const getScreenshot = (element, callback) => {
  if (!element) return;

  // flip the model
  const modelElement = element.querySelector(".modelContainer");

  /*   if (modelElement) {
    // videoElement.classList.add("my-camera-custom-class");
    modelElement.style.right = modelElement.style.left;
    console.log(modelElement.style.right);
    modelElement.style.left = "";
  } */

  if (modelElement) {
    // Get the current transform value
    let currentTransform = modelElement.style.transform;

    // Extract the x and y values from the translate function
    let translateValues = currentTransform.match(
      /translate\(([^,]+),\s*([^)]+)\)/
    );

    if (translateValues) {
      // Convert x and y values to numbers
      let x = parseFloat(translateValues[1]);
      let y = parseFloat(translateValues[2]);

      x = -x;

      // Set the new transform value back to the element
      modelElement.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  // flip the image
  // element.style.transform = "scaleX(-1)";

  html2canvas(element, {
    useCORS: true,
    scale: window.devicePixelRatio || 2,
  }).then((canvas) => {
    const base64Image = canvas.toDataURL("image/png");
    callback(base64Image);
  });
};

export default getScreenshot;
