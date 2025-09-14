export default {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Flashcards Generation Schema",
  "description": "Schema for AI-generated flashcard decks from chapter content",
  "required": ["title", "flashcards"],
  "properties": {
    "title": {
      "type": "string",
      "description": "Descriptive title for the flashcard deck that reflects the source content",
      "minLength": 5,
      "maxLength": 80,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9\\s\\-:&,.()]+[A-Za-z0-9]$"
    },
    "description": {
      "type": "string",
      "description": "Brief description of what topics this flashcard deck covers",
      "minLength": 20,
      "maxLength": 300
    },
    "flashcards": {
      "type": "array",
      "description": "Individual flashcards for spaced repetition learning",
      "minItems": 5,
      "maxItems": 50,
      "items": {
        "type": "object",
        "required": ["front", "back"],
        "properties": {
          "front": {
            "type": "string",
            "description": "Question, term, or prompt on the front of the flashcard",
            "minLength": 3,
            "maxLength": 200
          },
          "back": {
            "type": "string",
            "description": "Answer, definition, or explanation on the back of the flashcard",
            "minLength": 5,
            "maxLength": 500
          },
          "difficulty": {
            "type": "string",
            "description": "Complexity level for spaced repetition algorithms",
            "enum": ["easy", "medium", "hard"]
          },
          "tags": {
            "type": "array",
            "description": "Topic tags for organization and filtering",
            "items": {
              "type": "string",
              "minLength": 2,
              "maxLength": 30
            },
            "maxItems": 5
          },
          "hints": {
            "type": "array",
            "description": "Optional hints to help with difficult concepts",
            "items": {
              "type": "string",
              "minLength": 10,
              "maxLength": 150
            },
            "maxItems": 3
          }
        }
      }
    },
    "category": {
      "type": "string",
      "description": "Subject category for organizing flashcard decks",
      "enum": ["vocabulary", "concepts", "formulas", "facts", "procedures", "definitions", "mixed"]
    }
  }
};