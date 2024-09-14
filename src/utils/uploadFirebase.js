import { getStorage,getDownloadURL,uploadString,ref } from 'firebase/storage';
import {db} from '../firebase'
import { collection,addDoc } from 'firebase/firestore';

// Upload Image to Firebase Storage and Store URL in Firestore

const storage = getStorage();

function getUID() {
    return Date.now().toString(36);
}


 export const uploadImage = async (base64) => {

  const dataURL = base64.split(",")[1];
    try {
      // setLoading(true);
      const storageRef = ref(storage, `techbook/techbook_ai_photobooth_image_${Date.now()}.png`);  // Create a reference in Firebase Storage
      await uploadString(storageRef, dataURL, 'base64');  // Upload the image
      //get download url
      const downloadURL = await getDownloadURL(storageRef);
      //setDownloadUrl
    //setDownloadUrl(downloadURL); 

    // console.log(downloadURL);
      const valueRef = collection(db,'Techbook_Photo_Booth_testing');
      await addDoc(valueRef,
         {
        imageUrl: downloadURL,
        createdAt: Date.now(),
      }
    );
    return downloadURL;
      console.log('Image metadata saved to Firestore');
    } catch (error) {
      console.error('Error uploading image or saving to Firestore:', error);
    } finally {
    //   setLoading(false);
    }
  };