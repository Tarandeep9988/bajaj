require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL =
  process.env.OFFICIAL_EMAIL || "tarandeep2228.be23@chitkara.edu.in";
const GEMINI_MODEL = process.env.GEMINI_MODEL;

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const aiClient = (() => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
})();

const sendSuccess = (res, data) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
    data,
  });
};

const sendError = (res, status, message) => {
  res.status(status).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: message,
  });
};

const isInteger = (value) => Number.isInteger(value);

const fibonacciSeries = (n) => {
  const out = [];
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i += 1) {
    out.push(a);
    const next = a + b;
    a = b;
    b = next;
  }
  return out;
};

const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
};

const lcm = (a, b) => {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
};

const parseArray = (value) => {
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return null;
  const nums = [];
  for (const v of value) {
    if (!isInteger(v)) return null;
    nums.push(v);
  }
  return nums;
};

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return sendError(res, 400, "Invalid JSON body.");
    }

    const keys = Object.keys(body);
    if (keys.length !== 1) {
      return sendError(res, 400, "Request must contain exactly one key.");
    }

    const key = keys[0];

    if (key === "fibonacci") {
      const n = body.fibonacci;
      if (!isInteger(n) || n < 0 || n > 200) {
        return sendError(res, 400, "fibonacci must be an integer between 0 and 200.");
      }
      return sendSuccess(res, fibonacciSeries(n));
    }

    if (key === "prime") {
      const nums = parseArray(body.prime);
      if (!nums) {
        return sendError(res, 400, "prime must be a non-empty integer array.");
      }
      const primes = nums.filter((n) => isPrime(n));
      return sendSuccess(res, primes);
    }

    if (key === "lcm") {
      const nums = parseArray(body.lcm);
      if (!nums) {
        return sendError(res, 400, "lcm must be a non-empty integer array.");
      }
      let result = nums[0];
      for (let i = 1; i < nums.length; i += 1) {
        result = lcm(result, nums[i]);
      }
      return sendSuccess(res, result);
    }

    if (key === "hcf") {
      const nums = parseArray(body.hcf);
      if (!nums) {
        return sendError(res, 400, "hcf must be a non-empty integer array.");
      }
      let result = nums[0];
      for (let i = 1; i < nums.length; i += 1) {
        result = gcd(result, nums[i]);
      }
      return sendSuccess(res, result);
    }

    if (key === "AI") {
      const question = body.AI;
      if (typeof question !== "string" || question.trim().length === 0) {
        return sendError(res, 400, "AI must be a non-empty string.");
      }
      if (!aiClient) {
        return sendError(res, 503, "AI service not configured.");
      }
      const prompt = `Answer with a single word only. Question: ${question}`;
      const modelCandidates = GEMINI_MODEL
        ? [GEMINI_MODEL]
        : [
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash",
          ];

      let text = "";
      let lastError = null;
      for (const modelName of modelCandidates) {
        try {
          const model = aiClient.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          text = result?.response?.text?.() || "";
          if (text) break;
        } catch (err) {
          lastError = err;
        }
      }
      const answer = text.trim().split(/\s+/)[0] || "";
      if (!answer) {
        return sendError(
          res,
          502,
          lastError?.message || "AI service returned empty response."
        );
      }
      return sendSuccess(res, answer);
    }

    return sendError(res, 400, "Unsupported key.");
  } catch (err) {
    return sendError(res, 500, "Internal server error.");
  }
});

app.use((req, res) => {
  sendError(res, 404, "Not found.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
