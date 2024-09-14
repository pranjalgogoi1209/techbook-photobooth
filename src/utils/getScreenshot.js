const getScreenshot = (template, callback) => {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  const getImageData = (img) => {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    console.log(canvas.toDataURL("image/jpg"));

    return canvas.toDataURL("image/jpg");
  };

  console.log(template);

  var img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = template;

  img.onload = () => {
    const base64Data = getImageData(img);
    console.log("base64", base64Data);
    callback(base64Data);
  };
};

export default getScreenshot;
