# FinTrack PII & Financial Masking Service

FinTrack's PII (Personally Identifiable Information) masking service is an isolated Python microservice responsible for detecting and anonymizing sensitive financial and personal data in user inputs or logs. 

It is built defensively to support Turkish language semantics, merging standard NLP statistical boundaries with pinpoint local cryptographic validation (e.g. for Turkish National IDs).

## Features & Architecture

This service acts as an intelligent proxy utilizing a **Hybrid Recognition Architecture**:
1. **Microsoft Presidio:** Serves as the core logic engine bridging NLP analyzers and anonymizers.
2. **spaCy (Fallback Engine):** Default configuration for English, Russian, German, and Spanish grammatical processing.
3. **HuggingFace Transformers:** A dedicated fine-tuned Turkish BERT model (`bert-base-turkish-ner-cased`) identifies conceptual entities (`PERSON`, `LOCATION`, `ORGANIZATION`) for the Turkish language that would normally slip past regular expressions. Uses a custom heuristic scoring & deny-list validation to dramatically reduce LLM "false positive" hallucinations.
4. **Regex & Cryptographic Engine:** Fixed data (like IBANs, Bank Accounts, or TCKNs) utilizes static RegEx rules coupled with mathematical Checksum operations to eliminate false positives to near zero.

## Project Structure

The project has been modularized for clean scalability:
- `app.py`: The main FastAPI server, which configures the generic Presidio NLP parameters and exposes the REST interfaces.
- `recognizers.py`: Custom logic layer storing all the extended Transformer plugins, algorithmic check functions (TCKN Validation), and Regex block patterns.
- `pyproject.toml`: The `uv` managed definition file establishing constraints natively.

## How It Works 🤖

When text is sent to the `/api/anonymize` endpoint, the `AnalyzerEngine` parses the requested language. It loops the sequence through NLP detection, BERT tagging, and custom regex pattern marching concurrently. It compares overlapping boundaries and hands the resolved coordinate maps (i.e., `Start: 25, End: 36, Entity: TR_ID_NUMBER`) to the `AnonymizerEngine`, which irreversibly redacts the PII with its generic placeholder (e.g., `<TR_ID_NUMBER>`).

## Setup and Quickstart

We recommend running this service isolated from the JVM Backend and Node Frontend via `uv`.

### 1. Install Dependencies
```bash
# Sync dependency tree using astral-sh/uv
uv sync
```

### 2. Start the Uvicorn Server
```bash
# Run bare HTTP
uv run uvicorn app:app --port 8080 --host 0.0.0.0

# Optional: Run with Mkcert for local HTTPS development
uv run uvicorn app:app --port 8080 --host 0.0.0.0 --ssl-keyfile ../certs/localhost-key.pem --ssl-certfile ../certs/localhost.pem
```

*Note: On the first boot, the HuggingFace `pipeline` will download roughly ~400MB of the Turkish BERT model. Startups thereafter will be instantaneous via cache.*

### 3. Usage endpoints

#### Health Check
```bash
curl -X GET "http://localhost:8080/"
```

#### Anonymize Text Request
```bash
curl -X POST "http://localhost:8080/api/anonymize" \
 -H "Content-Type: application/json" \
 -d '{
       "text": "Benim adım Alper Karaca, Ankara'\''da kalıyorum. TCKN numaram 11111111110. E-posta adresim bilgi@fintrack.app",
       "language": "tr"
     }'
```

**Output:**
```json
{
  "status": "success",
  "detected_language": "tr",
  "anonymized_text": "<PERSON> adım <PERSON>, <LOCATION> kalıyorum. TCKN numaram <TR_ID_NUMBER>. E-posta adresim <EMAIL_ADDRESS>"
}
```
