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
  if(type=="withFrame"){
    html2canvas(element,{
      useCORS: true,
    scale: 5,
    x: 0,
    y: 0,
    width: element.offsetWidth,
    height: element.offsetHeight - 100, 
    }).then((canvas)=>{
      const base64Image = canvas.toDataURL("image/png");
      callback(base64Image);
    })
  }else{
    html2canvas(element,{
      useCORS:true,
      scale:5
    }).then((canvas)=>{
      const base64Image = canvas.toDataURL("image/png");
      callback(base64Image);
    })
  }
  // html2canvas(element, {
  //   useCORS: true,
  //   scale: 5,
  //   x: 0,
  //   y: 0,
  //   width: element.offsetWidth,
  //   height: element.offsetHeight - 200, 
  // }).then((canvas) => {
  //   if (type === "withFrame") {
  //     // Create a new canvas for cropping
  //     const croppedCanvas = document.createElement("canvas");
  //     const ctx = croppedCanvas.getContext("2d");

  //     // Set the new canvas dimensions (same width, but 50px less in height)
  //     croppedCanvas.width = canvas.width;
  //     croppedCanvas.height = canvas.height - 50; // Crop 50px from the bottom

  //     // Draw the original canvas onto the cropped canvas (except the bottom 50px)
  //     ctx.drawImage(
  //       canvas,
  //       0,
  //       0,
  //       canvas.width,
  //       canvas.height - 50,
  //       0,
  //       0,
  //       canvas.width,
  //       canvas.height - 50
  //     );

  //     // Convert the cropped canvas to base64 and pass it to the callback
  //     const base64Image = canvas.toDataURL("image/png");
  //     callback(base64Image);
  //   } else {
  //     // For other types, just return the full canvas screenshot
  //     const base64Image = canvas.toDataURL("image/png");
  //     callback(base64Image);
  //   }
  // });
};

export default getScreenshot;
