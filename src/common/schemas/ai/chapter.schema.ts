export default {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Chapter Generation Schema",
  "description": "Schema for AI-generated individual chapter content from uploaded documents",
  "required": ["title", "content", "order"],
  "properties": {
    "title": {
      "type": "string",
      "description": "Specific chapter title that accurately reflects the section content",
      "minLength": 5,
      "maxLength": 100,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9\\s\\-:&,.()]+[A-Za-z0-9]$"
    },
    "content": {
      "type": "string",
      "description": "Comprehensive chapter content in markdown format with detailed explanations, examples, and structured learning material",
      "minLength": 500,
      "maxLength": 15000
    },
    "description": {
      "type": "string",
      "description": "Optional brief overview of chapter objectives and key topics covered",
      "minLength": 50,
      "maxLength": 400
    },
    "estimatedDuration": {
      "type": "string",
      "description": "Time estimate for completing this chapter based on content depth",
      "pattern": "^\\d+\\s*(minute|minutes|hour|hours)$"
    },
    "order": {
      "type": "integer",
      "description": "Sequential position of this chapter within the course structure",
      "minimum": 1
    },
    "learningObjectives": {
      "type": "array",
      "description": "Specific learning outcomes for this chapter",
      "items": {
        "type": "string",
        "minLength": 15,
        "maxLength": 150
      },
      "maxItems": 5
    },
    "keyTopics": {
      "type": "array",
      "description": "Main topics and concepts covered in this chapter",
      "items": {
        "type": "string",
        "minLength": 5,
        "maxLength": 80
      },
      "maxItems": 10
    }
  }
};