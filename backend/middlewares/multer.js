import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
      storage,
      limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
      },
}).fields([
      { name: "file", maxCount: 1 },
      { name: "profilePhoto", maxCount: 1 },
]);
