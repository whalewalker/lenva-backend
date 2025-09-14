export default {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Course Generation Schema",
  "description": "Schema for AI-generated course content from uploaded documents",
  "required": ["title", "description", "subject", "level", "tags", "estimatedDuration", "learningObjectives", "keyConcepts", "chapters"],
  "properties": {
    "title": {
      "type": "string",
      "description": "Clear, engaging course title that accurately reflects the document content",
      "minLength": 10,
      "maxLength": 150,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9\\s\\-:&,.()]+[A-Za-z0-9]$"
    },
    "description": {
      "type": "string",
      "description": "Comprehensive course description in markdown format that provides overview, core concepts, technical terms, and chapter breakdown",
      "minLength": 200,
      "maxLength": 3000
    },
    "subject": {
      "type": "string",
      "description": "Primary subject area or domain of the course content",
      "enum": ["Technology", "Business", "Science", "Mathematics", "Engineering", "Arts", "Literature", "History", "Psychology", "Medicine", "Law", "Other"]
    },
    "level": {
      "type": "string",
      "description": "Difficulty level based on content complexity and required background knowledge",
      "enum": ["beginner", "intermediate", "advanced"]
    },
    "tags": {
      "type": "array",
      "description": "Relevant keywords and topics extracted from the document content",
      "items": {
        "type": "string",
        "minLength": 2,
        "maxLength": 30
      },
      "minItems": 3,
      "maxItems": 15,
      "uniqueItems": true
    },
    "estimatedDuration": {
      "type": "string",
      "description": "Realistic time estimate for course completion based on content volume and complexity",
      "pattern": "^\\d+\\s*(minute|minutes|hour|hours|day|days|week|weeks)$"
    },
    "learningObjectives": {
      "type": "array",
      "description": "Specific, measurable learning outcomes students will achieve",
      "items": {
        "type": "string",
        "minLength": 20,
        "maxLength": 200
      },
      "minItems": 3,
      "maxItems": 8
    },
    "keyConcepts": {
      "type": "array",
      "description": "Fundamental concepts and principles covered in the course",
      "items": {
        "type": "string",
        "minLength": 5,
        "maxLength": 100
      },
      "minItems": 5,
      "maxItems": 20
    },
    "chapters": {
      "type": "array",
      "description": "Organized chapter structure with detailed content",
      "items": {
        "type": "object",
        "required": ["title", "content", "description", "estimatedDuration", "order"],
        "properties": {
          "title": {
            "type": "string",
            "description": "Descriptive chapter title that clearly indicates the content focus",
            "minLength": 5,
            "maxLength": 100
          },
          "content": {
            "type": "string",
            "description": "Comprehensive chapter content in markdown format with proper structure, examples, and detailed explanations",
            "minLength": 500,
            "maxLength": 10000
          },
          "description": {
            "type": "string",
            "description": "Brief overview of what the chapter covers and its learning objectives",
            "minLength": 50,
            "maxLength": 300
          },
          "estimatedDuration": {
            "type": "string",
            "description": "Time estimate for completing this chapter",
            "pattern": "^\\d+\\s*(minute|minutes|hour|hours)$"
          },
          "order": {
            "type": "integer",
            "description": "Sequential order of the chapter in the course",
            "minimum": 1
          }
        }
      },
      "minItems": 3,
      "maxItems": 20
    }
  }
};