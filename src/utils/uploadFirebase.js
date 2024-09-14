 // Upload Image to Firebase Storage and Store URL in Firestore

 export const uploadImage = async (ref) => {
    const canvas = ref.current;
    const dataURL = canvas.toDataURL('image/png');  // Convert canvas to data URL

    try {
      setLoading(true);
      const storageRef = ref(storage, `images/photo_${Date.now()}.png`);  // Create a reference in Firebase Storage
      await uploadString(storageRef, dataURL, 'data_url');  // Upload the image
      const downloadURL = await getDownloadURL(storageRef); // Get the download URL
      //setDownloadUrl
    //   setDownloadUrl(downloadURL); 

      // Save image URL and other details to Firestore collection
      await addDoc(collection(db, 'generatedImages'), {
        imageUrl: downloadURL,
        createdAt: new Date(),
        // Add any other metadata if necessary
      });

      console.log('Image metadata saved to Firestore');
    } catch (error) {
      console.error('Error uploading image or saving to Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  