export const getImageFromIndexedDB = async (id: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("PosterDB", 1);

        request.onsuccess = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const tx = db.transaction("images", "readonly");
            const store = tx.objectStore("images");
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const result = getRequest.result;
                if (!result) return resolve(null);

                if (result instanceof File) {
                    // Convert File → Blob URL for <img>
                    const url = URL.createObjectURL(result);
                    resolve(url);
                } else if (typeof result === "string") {
                    // Already a base64 string
                    resolve(result);
                } else {
                    resolve(null);
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        };

        request.onerror = () => reject(request.error);
    });
};

export const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};