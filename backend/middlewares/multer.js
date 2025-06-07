import multer from "multer";
const storage = multer.memoryStorage();
export const singleUpload = multer({
      storage,
      limits: {
            fileSize: 2 * 1024 * 1024 // 2MB limit
      }
}).single("file");