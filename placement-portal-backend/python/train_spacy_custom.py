import spacy
from spacy.tokens import DocBin
import json

# ==============================================================================
# SPACY CUSTOM TRAINING SCRIPT FOR RESUME PARSING
# ==============================================================================
# To get higher accuracy, you must provide annotated data.
# Each record contains a line of text, followed by a dictionary of 'entities',
# where each entity is defined by its start_char, end_char, and LABEL.
# ==============================================================================

TRAIN_DATA = [
    (
        "I am an experienced Software Engineer at Google with strong skills in Python, Java, and Machine Learning.",
        {"entities": [(41, 47, "ORG"), (68, 74, "SKILL"), (76, 80, "SKILL"), (86, 102, "SKILL")]}
    ),
    (
        "Developed scalable microservices using Spring Boot and Docker hosted on AWS.",
        {"entities": [(37, 48, "SKILL"), (53, 59, "SKILL"), (70, 73, "SKILL")]}
    ),
    (
        "Graduated from Stanford University with a degree in Computer Science.",
        {"entities": [(15, 34, "ORG"), (52, 68, "DEGREE")]}
    ),
    (
        "Worked extensively with React.js and Node.js to build frontend architecture.",
        {"entities": [(24, 32, "SKILL"), (37, 44, "SKILL")]}
    )
]

def prepare_training_data():
    """
    Converts the standard tuple training data into spaCy's native DocBin format (.spacy)
    """
    # Load a blank English model or the existing sm model to start fine-tuning
    nlp = spacy.blank("en") 
    doc_bin = DocBin() 

    print("Processing training data...")
    for text, annot in TRAIN_DATA:
        doc = nlp.make_doc(text)
        ents = []
        for start, end, label in annot["entities"]:
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span is None:
                print(f"Skipping entity [{start}:{end}] in text: '{text[:20]}...' (alignment error)")
            else:
                ents.append(span)
        
        try:
            doc.ents = ents
            doc_bin.add(doc)
        except Exception as e:
            print(f"Error adding entities: {e}")

    # Save to disk
    doc_bin.to_disk("./train.spacy")
    print("Successfully saved training data to train.spacy!")
    print("\nNext Steps to Train:")
    print("1. Initialize config: python -m spacy init config config.cfg --lang en --pipeline ner --optimize efficiency")
    print("2. Run the training:  python -m spacy train config.cfg --output ./custom_spacy_model --paths.train ./train.spacy --paths.dev ./train.spacy")

if __name__ == "__main__":
    prepare_training_data()
