import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SchemaService {
  private readonly schemas: Map<string, any> = new Map();
  private readonly logger = new Logger(SchemaService.name);

  constructor() {
    this.initializeSchemas();
  }

  getSchema(templateName: string): any | null {
    return this.schemas.get(templateName) || null;
  }

  getSchemaAsJsonString(templateName: string): string {
    const schemaDefinition = this.getSchema(templateName);
    if (!schemaDefinition) {
      return '';
    }
    return JSON.stringify(schemaDefinition, null, 2);
  }

  private initializeSchemas(): void {
    // Course schema
    this.schemas.set('course', {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        subject: { type: 'string' },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        tags: { type: 'array', items: { type: 'string' } },
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              order: { type: 'number' },
              assets: { type: 'array', items: { type: 'object' } }
            },
            required: ['title', 'content', 'order']
          }
        }
      },
      required: ['title', 'description', 'level', 'chapters']
    });

    // Chapter schema (using course schema structure)
    this.schemas.set('chapter', {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        order: { type: 'number' },
        assets: { type: 'array', items: { type: 'object' } }
      },
      required: ['title', 'content', 'order']
    });

    // Flashcard schema
    this.schemas.set('flashcards', {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['front', 'back']
          }
        }
      },
      required: ['flashcards']
    });

    this.schemas.set('flashcard', {
      type: 'object',
      properties: {
        front: { type: 'string' },
        back: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['front', 'back']
    });

    // Quiz schema
    this.schemas.set('quiz', {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string', enum: ['multiple_choice', 'true_false', 'single-choice'] },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    value: { type: 'string' },
                    isCorrect: { type: 'boolean' }
                  },
                  required: ['label', 'value', 'isCorrect']
                }
              },
              explanation: { type: 'string' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              order: { type: 'number' }
            },
            required: ['text', 'type', 'options']
          }
        }
      },
      required: ['title', 'questions']
    });

    // Question schema
    this.schemas.set('questions', {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string', enum: ['multiple_choice', 'multi_select', 'true_false', 'short_answer', 'fill_blank', 'matching', 'cloze'] },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    value: { type: 'string' },
                    isCorrect: { type: 'boolean' }
                  },
                  required: ['label', 'value', 'isCorrect']
                }
              },
              answer: {
                type: 'object',
                properties: {
                  index: { type: 'number' },
                  indices: { type: 'array', items: { type: 'number' } },
                  text: { type: 'string' },
                  pairs: { type: 'array', items: { type: 'array', items: { type: 'string' } } }
                }
              },
              explanation: { type: 'string' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              tags: { type: 'array', items: { type: 'string' } },
              order: { type: 'number' }
            },
            required: ['text', 'type']
          }
        }
      },
      required: ['questions']
    });

    this.logger.log(`Initialized ${this.schemas.size} schema validators`);
  }
}
