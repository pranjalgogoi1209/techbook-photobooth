import html2canvas from "html2canvas";

const getScreenshot = ({ element, type }, callback) => {
  if (!element) return;

  // If the type is "withFrame", apply transformations
  if (type === "withFrame") {
    const modelElement = element.querySelector(".modelContainer");

    if (modelElement) {
      let currentTransform = modelElement.style.transform;
      let translateValues = currentTransform.match(
        /translate\(([^,]+),\s*([^)]+)\)/
      );

      if (translateValues) {
        let x = parseFloat(translateValues[1]);
        let y = parseFloat(translateValues[2]);
        x = -x;
        modelElement.style.transform = `translate(${x}px, ${y}px)`;
      }
    }
  }

  // Capture the screenshot using html2canvas
  if (type == "withFrame") {
    html2canvas(element, {
      useCORS: true,
      scale: 2,
      x: 0,
      y: 0,
      width: element.offsetWidth,
      height: element.offsetHeight - element.offsetHeight / 8,
    }).then((canvas) => {
      const base64Image = canvas.toDataURL("image/png");
      callback(base64Image);
    });
  } else {
    html2canvas(element, {
      useCORS: true,
      scale: 5,
    }).then((canvas) => {
      const base64Image = canvas.toDataURL("image/png");
      callback(base64Image);
    });
  }
};

export default getScreenshot;
