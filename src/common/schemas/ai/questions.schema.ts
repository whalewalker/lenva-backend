export default {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Questions Generation Schema",
  "description": "Schema for AI-generated standalone questions for discussion and reflection",
  "required": ["questions"],
  "properties": {
    "questions": {
      "type": "array",
      "description": "Array of thought-provoking questions for deeper learning",
      "minItems": 3,
      "maxItems": 20,
      "items": {
        "type": "object",
        "required": ["questionText", "questionType", "purpose"],
        "properties": {
          "questionText": {
            "type": "string",
            "description": "The question text designed to promote critical thinking",
            "minLength": 15,
            "maxLength": 300
          },
          "questionType": {
            "type": "string",
            "description": "Type of question based on learning objective",
            "enum": [
              "reflection",
              "analysis", 
              "synthesis",
              "evaluation",
              "application",
              "comparison",
              "prediction",
              "interpretation",
              "discussion",
              "creative"
            ]
          },
          "purpose": {
            "type": "string",
            "description": "Educational purpose and learning goal of this question",
            "minLength": 10,
            "maxLength": 200
          },
          "difficulty": {
            "type": "string",
            "description": "Cognitive difficulty level",
            "enum": ["remember", "understand", "apply", "analyze", "evaluate", "create"]
          },
          "suggestedAnswerLength": {
            "type": "string",
            "description": "Recommended response length for students",
            "enum": ["short (1-2 sentences)", "medium (paragraph)", "long (multiple paragraphs)", "extended (essay-style)"]
          },
          "keywords": {
            "type": "array",
            "description": "Key concepts students should address in their response",
            "items": {
              "type": "string",
              "minLength": 2,
              "maxLength": 50
            },
            "maxItems": 8
          },
          "context": {
            "type": "string",
            "description": "Background context or scenario for the question",
            "maxLength": 400
          },
          "sampleResponse": {
            "type": "string",
            "description": "Example of a good response to guide students",
            "minLength": 50,
            "maxLength": 800
          },
          "relatedTopics": {
            "type": "array",
            "description": "Related topics students might explore in their response",
            "items": {
              "type": "string",
              "minLength": 3,
              "maxLength": 60
            },
            "maxItems": 5
          },
          "assessmentCriteria": {
            "type": "array",
            "description": "Criteria for evaluating student responses",
            "items": {
              "type": "string",
              "minLength": 10,
              "maxLength": 100
            },
            "maxItems": 4
          }
        }
      }
    },
    "category": {
      "type": "string",
      "description": "Category of questions for organization",
      "enum": [
        "conceptual-understanding",
        "critical-thinking",
        "problem-solving",
        "real-world-application", 
        "ethical-considerations",
        "comparative-analysis",
        "future-implications",
        "personal-reflection"
      ]
    },
    "instructions": {
      "type": "string",
      "description": "General instructions for students on how to approach these questions",
      "minLength": 50,
      "maxLength": 400
    }
  }
};