const express = require("express");
const axios = require("axios");

const router = express.Router();

const FRAUD_ENGINE = process.env.FRAUD_ENGINE_URL || "http://localhost:8002";

router.post("/execute", async (req, res) => {
  try {
    const response = await axios.post(
      `${FRAUD_ENGINE}/api/risk/evaluate`,
      req.body
    );

    res.json(response.data);
  } catch (error) {
    console.error("Fraud engine error:", error.message);
    res.status(500).json({ error: "Fraud engine failed" });
  }
});

module.exports = router;