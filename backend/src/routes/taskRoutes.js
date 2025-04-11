const express = require("express");
const router = express.Router();
const { createTask, markTaskCompleted } = require("../controllers/taskController");

router.post("/create", createTask);
router.post("/complete", markTaskCompleted);

module.exports = router;
