const express = require("express");
const path = require("path");
const repo = require("../db/conversationRepo");

const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "queue.html"));
});

router.get("/api/queue", async (req, res) => {
  const queue = await repo.listQueue();
  res.json(queue);
});

router.get("/api/conversations/:id/messages", async (req, res) => {
  const history = await repo.getHistory(req.params.id, 200);
  res.json(history);
});

router.post("/api/conversations/:id/assume", async (req, res) => {
  const assumedBy = req.body?.assumedBy || "vendedor";
  await repo.assumeConversation(req.params.id, assumedBy);
  res.sendStatus(204);
});

module.exports = router;
