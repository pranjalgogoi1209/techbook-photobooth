import html2canvas from "html2canvas";

const getScreenshot = (element, callback) => {
  if (!element) return;

  console.log(element);

  // Use html2canvas to capture the screenshot of the entire DOM element
  html2canvas(element, { useCORS: true }).then((canvas) => {
    const base64Image = canvas.toDataURL("image/png");
    callback(base64Image);
  });
};

export default getScreenshot;
