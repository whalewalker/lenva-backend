export default {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Quiz Generation Schema",
  "description": "Schema for AI-generated quizzes from chapter content for assessment",
  "required": ["title", "questions"],
  "properties": {
    "title": {
      "type": "string",
      "description": "Clear quiz title that indicates the content area being assessed",
      "minLength": 5,
      "maxLength": 100,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9\\s\\-:&,.()]+[A-Za-z0-9]$"
    },
    "description": {
      "type": "string",
      "description": "Instructions and overview of what the quiz assesses",
      "minLength": 30,
      "maxLength": 400
    },
    "timeLimit": {
      "type": "integer",
      "description": "Time limit for completing the quiz in minutes",
      "minimum": 5,
      "maximum": 180
    },
    "passingScore": {
      "type": "integer",
      "description": "Minimum percentage score required to pass the quiz",
      "minimum": 0,
      "maximum": 100
    },
    "difficulty": {
      "type": "string",
      "description": "Overall difficulty level of the quiz",
      "enum": ["beginner", "intermediate", "advanced"]
    },
    "allowMultipleAttempts": {
      "type": "boolean",
      "description": "Whether students can retake this quiz",
      "default": true
    },
    "showResultsImmediately": {
      "type": "boolean",
      "description": "Whether to show results and feedback immediately after submission",
      "default": true
    },
    "questions": {
      "type": "array",
      "description": "Array of quiz questions with various formats",
      "minItems": 3,
      "maxItems": 30,
      "items": {
        "type": "object",
        "required": ["questionText", "questionType", "points"],
        "properties": {
          "questionText": {
            "type": "string",
            "description": "The main question or prompt text",
            "minLength": 10,
            "maxLength": 500
          },
          "questionType": {
            "type": "string",
            "description": "Format type of the question",
            "enum": ["multiple-choice", "true-false", "short-answer", "matching", "ordering"]
          },
          "points": {
            "type": "integer",
            "description": "Point value for this question",
            "minimum": 1,
            "maximum": 10
          },
          "options": {
            "type": "array",
            "description": "Answer options for multiple choice, matching, or ordering questions",
            "items": {
              "type": "object",
              "required": ["text", "isCorrect"],
              "properties": {
                "text": {
                  "type": "string",
                  "description": "Option text",
                  "minLength": 1,
                  "maxLength": 200
                },
                "isCorrect": {
                  "type": "boolean",
                  "description": "Whether this option is correct"
                },
                "explanation": {
                  "type": "string",
                  "description": "Explanation for why this option is correct or incorrect",
                  "maxLength": 300
                }
              }
            },
            "minItems": 2,
            "maxItems": 6
          },
          "correctAnswer": {
            "type": "string",
            "description": "Correct answer for short-answer questions",
            "maxLength": 200
          },
          "explanation": {
            "type": "string",
            "description": "Detailed explanation of the correct answer and concept",
            "minLength": 20,
            "maxLength": 500
          },
          "hints": {
            "type": "array",
            "description": "Optional hints to guide students toward the answer",
            "items": {
              "type": "string",
              "minLength": 10,
              "maxLength": 150
            },
            "maxItems": 2
          },
          "tags": {
            "type": "array",
            "description": "Topic tags for categorizing questions",
            "items": {
              "type": "string",
              "minLength": 2,
              "maxLength": 30
            },
            "maxItems": 5
          }
        }
      }
    },
    "category": {
      "type": "string",
      "description": "Assessment category for organizing quizzes",
      "enum": ["knowledge-check", "comprehension", "application", "analysis", "practice-test", "final-assessment"]
    }
  }
};