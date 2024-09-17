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
      const storageRef = ref(storage, `techbook/techbook_images_${Date.now()}.png`);
      await uploadString(storageRef, dataURL, 'base64');  
      const downloadURL = await getDownloadURL(storageRef);
      const valueRef = collection(db,'techbook_qr_urls');
      await addDoc(valueRef,
         {
        imageUrl: downloadURL,
        createdAt: Date.now(),
      }
    );
    return downloadURL;
    
    } catch (error) {
      console.error('Error uploading image or saving to Firestore:', error);
    } finally {
    //   setLoading(false);
    }
  };