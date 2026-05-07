import re
from presidio_analyzer import Pattern, PatternRecognizer, EntityRecognizer, RecognizerResult
from transformers import pipeline

class TurkishTransformerRecognizer(EntityRecognizer):
    """
    A custom Presidio EntityRecognizer that uses a HuggingFace Transformer model
    to detect Named Entities (PERSON, LOCATION, ORGANIZATION) in Turkish text.
    It acts as a high-accuracy fallback when spaCy CPU models fail for Turkish.
    """
    def __init__(self):
        super().__init__(supported_entities=["PERSON", "LOCATION", "ORGANIZATION"], supported_language="tr")
        # Load a Turkish BERT model fine-tuned for NER
        # We use simple aggregation to group sub-tokens into complete words
        self.ner_pipeline = pipeline("ner", model="savasy/bert-base-turkish-ner-cased", aggregation_strategy="simple")
        
        # Map HuggingFace model labels to Presidio entity types
        self.label_mapping = {
            "PER": "PERSON",
            "LOC": "LOCATION",
            "ORG": "ORGANIZATION"
        }

    def load(self) -> None:
        """Required by EntityRecognizer but handled during init."""
        pass

    def analyze(self, text: str, entities: list[str], nlp_artifacts=None) -> list[RecognizerResult]:
        """
        Analyzes the text using the HuggingFace pipeline and translates results 
        into Presidio's RecognizerResult format while filtering false positives.
        """
        results = []
        try:
            hf_results = self.ner_pipeline(text)
            for res in hf_results:
                entity_group = res.get("entity_group")
                presidio_label = self.label_mapping.get(entity_group)
                
                # Check if the detected entity matches one of the requested entities
                if presidio_label and presidio_label in entities:
                    score = float(res.get("score", 0.85))
                    word_start = res["start"]
                    word_end = res["end"]
                    word = text[word_start:word_end]
                    
                    # 1. Score Threshold: Ignore low-confidence predictions
                    if score < 0.85:
                        continue
                        
                    # 2. Deny-list: Ignore common false positives (like sentence starters, acronyms)
                    ignore_list = {"benim", "tckn", "tc", "iban", "adım", "soyadım", "hesap", "no", "numaram", "olan"}
                    word_clean = word.lower().strip(" \t\n\r.;,!?()[]{}")
                    
                    if word_clean in ignore_list:
                        continue
                        
                    # Also ignore if the model captures the word with subwords markers (##)
                    if res.get("word", "").replace("#", "").lower().strip() in ignore_list:
                        continue
                        
                    # 3. Length Validation: Usually, valid entities are > 1 character
                    if len(word_clean) < 2:
                        continue
                    
                    results.append(RecognizerResult(
                        entity_type=presidio_label,
                        start=word_start,
                        end=word_end,
                        score=score
                    ))
        except Exception as e:
            print(f"HF Pipeline error: {e}")
        return results

class TCKNRecognizer(EntityRecognizer):
    """
    A custom Presidio EntityRecognizer to identify and cryptographically validate 
    Turkish Identification Numbers (TCKN).
    """
    def __init__(self):
        super().__init__(supported_entities=["TR_ID_NUMBER"], supported_language="tr")
        
    def load(self) -> None:
        """Required by EntityRecognizer but handled during init."""
        pass
        
    def analyze(self, text: str, entities: list[str], nlp_artifacts=None) -> list[RecognizerResult]:
        """
        Extracts 11-digit numbers ending in an even digit using Regex, 
        then validates the checksum before accepting them as TCKN.
        """
        results = []
        pattern = re.compile(r"\b[1-9][0-9]{9}[02468]\b")
        for match in pattern.finditer(text):
            tckn = match.group()
            if self._validate_tckn(tckn):
                results.append(RecognizerResult(
                    entity_type="TR_ID_NUMBER",
                    start=match.start(),
                    end=match.end(),
                    score=1.0
                ))
        return results
        
    def _validate_tckn(self, tckn: str) -> bool:
        """
        Cryptographically validates the 10th and 11th checksum digits of a TCKN.
        """
        try:
            digits = [int(d) for d in tckn]
            sum_odd = sum(digits[0:9:2])
            sum_even = sum(digits[1:8:2])
            digit_10 = ((sum_odd * 7) - sum_even) % 10
            digit_11 = sum(digits[0:10]) % 10
            return digits[9] == digit_10 and digits[10] == digit_11
        except Exception:
            return False

# Regex-based recognizer for Turkish IBAN formats
iban_tr_recognizer = PatternRecognizer(
    supported_entity="TR_IBAN",
    supported_language="tr",
    patterns=[Pattern(name="iban_tr", regex=r"TR\s*\d{2}\s*(?:\d\s*){22}", score=0.95)]
)

# Regex-based recognizer for general Turkish bank account numbers referenced by keywords
acc_no_recognizer = PatternRecognizer(
    supported_entity="TR_ACCOUNT_NUMBER",
    supported_language="tr",
    patterns=[Pattern(name="acc_no_pattern", regex=r"(?i)\b(?:hesap no|hesap numarası|hesap numarasi|hesap)\s*[:\-]?\s*([0-9\s]{7,16})\b", score=0.85)]
)

# Fallback regex-based email recognizer for Turkish text parsing
email_tr_recognizer = PatternRecognizer(
    supported_entity="EMAIL_ADDRESS",
    supported_language="tr",
    patterns=[Pattern(name="email_tr", regex=r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", score=1.0)]
)

def register_custom_recognizers(analyzer_registry):
    """
    Helper function to add all custom FinTrack recognizers to the Presidio registry.
    """
    analyzer_registry.add_recognizer(TurkishTransformerRecognizer())
    analyzer_registry.add_recognizer(TCKNRecognizer())
    analyzer_registry.add_recognizer(iban_tr_recognizer)
    analyzer_registry.add_recognizer(acc_no_recognizer)
    analyzer_registry.add_recognizer(email_tr_recognizer)
