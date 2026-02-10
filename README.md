# BFHL API

## Endpoints
- POST /bfhl
- GET /health

## Setup
1. Install deps: `npm install`
2. Copy `.env.example` to `.env` and set values (optionally set `GEMINI_MODEL`, default: `gemini-2.5-flash-lite`).
3. Start: `npm start`

## Examples
### POST /bfhl
```
{ "fibonacci": 7 }
{ "prime": [2,4,7,9,11] }
{ "lcm": [12,18,24] }
{ "hcf": [24,36,60] }
{ "AI": "What is the capital city of Maharashtra?" }
```

### GET /health
```
{ "is_success": true, "official_email": "YOUR CHITKARA EMAIL" }
```
