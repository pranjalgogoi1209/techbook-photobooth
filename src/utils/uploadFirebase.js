import { getStorage,getDownloadURL,uploadString,ref,storage } from 'firebase/storage';
import {db} from '../firebase'
import { collection,addDoc } from 'firebase/firestore';

// Upload Image to Firebase Storage and Store URL in Firestore

const storage = getStorage();

function getUID() {
    return Date.now().toString(36);
}


 export const uploadImage = async (ref) => {
    const canvas = ref.current;
    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png');  

    try {
      setLoading(true);
      const storageRef = ref(storage, `techbook_ai_photo_booth/image_${Date.now()}.png`);  // Create a reference in Firebase Storage
      await uploadString(storageRef, dataURL, 'base64');  // Upload the image
      //get download url
      const downloadURL = await getDownloadURL(storageRef);
      //setDownloadUrl
    //setDownloadUrl(downloadURL); 

      const valueRef = collection(db,'collection_name');
      await addDoc(valueRef,
         {
        imageUrl: downloadURL,
        createdAt: new Date(),
      }
    );

      console.log('Image metadata saved to Firestore');
    } catch (error) {
      console.error('Error uploading image or saving to Firestore:', error);
    } finally {
    //   setLoading(false);
    }
  };