const router = require("express").Router();

const userController = require("../controller/userController");
const authController = require("../controller/authController");

router.post(
  "/generate-zego-token",
  authController.protect,
  userController.generateZegoToken
);

router.get("/get-me", authController.protect, userController.getMe);
router.patch("/update-me", authController.protect, userController.updateMe);
router.get("/get-all-verified-users", authController.protect, userController.getAllVerifiedUsers);
router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-requests", authController.protect, userController.getRequests);
router.get("/get-friends", authController.protect, userController.getFriends);




module.exports = router;
