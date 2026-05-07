from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine

from recognizers import register_custom_recognizers

app = FastAPI(title="FinTrack PII & Financial Masking Service")

# Configure the underlying spaCy NLP Engine for multi-language tokenization
nlp_configuration = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "en", "model_name": "en_core_web_lg"},
        {"lang_code": "de", "model_name": "de_core_news_lg"},
        {"lang_code": "es", "model_name": "es_core_news_lg"},
        {"lang_code": "ru", "model_name": "ru_core_news_lg"},
        {"lang_code": "tr", "model_name": "en_core_web_lg"} # Fallback model for basic tokenization
    ]
}

provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
nlp_engine = provider.create_engine()

# Initialize the Presidio Analyzer Engine
analyzer = AnalyzerEngine(
    nlp_engine=nlp_engine, 
    supported_languages=["en", "de", "es", "ru", "tr"]
)

# Register our custom Turkish and Financial rules into the Presidio Engine
register_custom_recognizers(analyzer.registry)

# Initialize the Presidio Masking Engine (Anonymizer)
anonymizer = AnonymizerEngine()

class TextRequest(BaseModel):
    """
    Pydantic Model for incoming HTTP request body validation.
    """
    text: str
    language: str = "tr"

@app.get("/")
def health_check():
    """
    Service health check endpoint. Useful for Docker/Kubernetes probes.
    """
    return {"status": "ok", "service": "FinTrack PII & Financial Masking Service"}

@app.post("/api/anonymize")
def anonymize_text(request: TextRequest):
    """
    Primary endpoint for processing block text and applying PII maskings.
    It passes the string through the configured NLP engines and Custom Recognizers
    to map and redact sensitive identifiers.
    """
    try:
        entities = [
            "PERSON", 
            "PHONE_NUMBER", 
            "EMAIL_ADDRESS", 
            "LOCATION", 
            "CREDIT_CARD",        
            "IBAN_CODE",          
            "TR_ID_NUMBER",       
            "TR_IBAN",            
            "TR_ACCOUNT_NUMBER",
            "ORGANIZATION"
        ]
        
        results = analyzer.analyze(
            text=request.text, 
            entities=entities, 
            language=request.language
        )
        
        anonymized_result = anonymizer.anonymize(text=request.text, analyzer_results=results)
        
        return {
            "status": "success",
            "detected_language": request.language,
            "anonymized_text": anonymized_result.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))