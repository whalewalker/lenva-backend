import { Injectable } from '@nestjs/common';
import { SchemaService } from './schema.service';

@Injectable()
export class AIPromptService {
  private readonly templates: Map<string, string>;

  constructor(private readonly schemaService: SchemaService) {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Get a template by name
   */
  getTemplate(templateName: string): string {
    return this.templates.get(templateName) ?? '';
  }

  /**
   * Replace variables in a template
   */
  replaceVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Get processed template with variables replaced
   */
  getProcessedTemplate(
    templateName: string,
    variables: Record<string, any> = {},
  ): string {
    const template = this.getTemplate(templateName);
    const processedTemplate = this.replaceVariables(template, variables);

    const instructions = `
  ----
  **IMPORTANT Instructions for AI**

- Use *only* the uploaded content as your source of truth. Do **not** hallucinate or include information not explicitly present.  
- Your response **must strictly follow** the expected JSON structure.  
- Return **only valid JSON** — no other text, no markdown wrapper, no explanations.  
- Ensure the content is educationally sound and pedagogically appropriate.  
- Maintain consistency across all generated content.  
- Use the **MongoDB model structure** with proper field names.  
- **Format all content fields** (descriptions, summaries, chapter content, explanations) using proper Markdown syntax.  

### Markdown Formatting Requirements
- Use headers: #, ##, ###
- Use lists: -, *
- Use code blocks: \\\`\\\`\\\`
- Use emphasis: **bold**, *italic*
- Use links where relevant: [text](url)

---

Your final output must be valid JSON that can be parsed directly.`;


    const schema = this.schemaService.getSchemaAsJsonString(templateName);
    if (schema) {
      return `${instructions}\n\n${processedTemplate}\n\n**JSON Schema:**\n\`\`\`json\n${schema}\n\`\`\``;
    }

    return `${instructions}\n\n${processedTemplate}`;
  }

  /**
   * Get structured template with format reference
   */
  getStructuredTemplate<T extends object>(
    templateName: string,
    formatReference: T,
    variables: Record<string, string> = {},
  ): { prompt: string; format: T } {
    const template = this.getProcessedTemplate(templateName, variables);
    return {
      prompt: template,
      format: formatReference,
    };
  }

  /**
   * Initialize all templates
   */
  private initializeTemplates(): void {
    this.templates.set(
      'course',
      `You are an AI expert in educational content analysis and organization. Your task is to analyze the provided educational content and generate a foundational course outline. You must not introduce any new information that is not reasonably inferred from the input. The depth and length of the generated content, including the number of chapters and detail in summaries, should be appropriate to the richness and volume of the provided resource material.

The output must include:
- A clear and relevant **course title**.
- A detailed comprehensive **course summary string**. This string must contain, in the following strict order:
    1. A narrative **course overview** describing the core subject matter, main themes, and topics covered.
    2. A bulleted list of **core concepts** that form the foundation of the course material.
    3. A bulleted list of **technical terms** representing the key technologies, tools, and methodologies covered.
    4. A detailed **chapter-by-chapter breakdown** that begins with the phrase:  
       "The course content is organized into these chapters:"  
       Each chapter should include:
         - A clear chapter title.
         - A concise description of the chapter's subject matter and content areas.
         - Bullet points outlining the main topics and concepts covered.

- A **list of suggested chapters** (separate from the summary string) for organizing course content, with each chapter containing:
   - title: the chapter title
   - quizQuestionCount: number of quiz questions to be generated for this chapter (scale proportionally to chapter size and complexity)
   - flashcardCount: number of flashcards to be generated for this chapter (scale proportionally to chapter size and concept density)
   - acronymCount: number of acronyms to be generated for this chapter (based on actual technical terms present)
   - simulationQuestionCount: number of simulation questions to be generated for this chapter (scale according to practical applications in the chapter)
- A **metadata** object (separate from the summary string) including:
    - Overall course duration 
    - Subject category
    - Difficulty level: {{difficulty}}

Instructions:
1. **Content Structure**: Analyze the provided educational material and extract main topics and subject areas.
2. **Summary String Format**: Include course description, core concepts, technical terms, and chapter structure.
3. **Chapter Organization**: List all chapter titles in sequential order.
4. **Metadata**: Include difficulty level, course duration, and subject category.

Expected JSON Structure:
{
  "title": "Course Title",
  "description": "Comprehensive course description",
  "subject": "Subject area",
  "level": "{{difficulty}}",
  "tags": ["tag1", "tag2", "tag3"],
  "chapters": [
    {
      "title": "Chapter Title",
      "content": "Chapter content in markdown format",
      "order": 1,
      "assets": []
    }
  ]
}`
    );

    this.templates.set(
      'chapter',
      `You are an AI content organizer analyzing a specific chapter titled "{{title}}" at {{difficulty}} level. Extract and structure the relevant content from the provided material, focusing specifically on this chapter's scope.

Create a comprehensive chapter breakdown including:
- Title: Use "{{title}}" exactly as given
- Summary: Clear narrative overview explaining the chapter's core content, main concepts, and key learning points
- Deep Dive: Detailed chapter content organized with Core Concepts, Technical Implementation, and Key Considerations sections
- Metadata: Key concepts and estimated time

Instructions:
1. Extract content relevant only to this specific chapter
2. Adapt detail level to {{difficulty}}
3. Format all bullet points with proper markdown
4. Include clear examples where appropriate
5. Structure deep-dive content with clear headings

Expected JSON Structure:
{
  "title": "{{title}}",
  "content": "Detailed chapter content in markdown format with proper structure, examples, and explanations",
  "order": 1,
  "assets": []
}`
    );

    this.templates.set(
      'flashcards',
      `You are an AI expert in creating effective flashcards for active recall learning. Generate exactly {{count}} comprehensive flashcards for the chapter titled "{{title}}" at {{difficulty}} level.

Instructions:
1. Create exactly {{count}} flashcards covering key concepts from this specific chapter
2. Ensure progressive difficulty matching {{difficulty}} level:
   - Basic: Core concepts and definitions
   - Intermediate: Applications and relationships between concepts
   - Advanced: Edge cases, nuances, and complex implementations
3. Include practical examples and real-world applications for each concept
4. Focus on conceptual understanding and connections to other topics
5. Each flashcard must have:
   - Front: Concise question, term, or prompt
   - Back: Clear, direct answer
   - Explanation: Detailed elaboration with examples and context
6. Distribute flashcards across different concept categories in the chapter
7. Prioritize the most important concepts based on their relevance to the overall topic

If fewer than {{count}} key concepts exist in the chapter content, focus on quality over quantity. Create multiple flashcards for complex concepts rather than inventing content.

Expected JSON Structure:
{
  "flashcards": [
    {
      "front": "Question or concept to learn",
      "back": "Answer or explanation",
      "tags": ["tag1", "tag2"]
    }
  ]
}`
    );

    this.templates.set(
      'quiz',
      `You are an AI assessment expert specializing in comprehensive knowledge evaluation. Create a quiz for the resource "{{title}}" at {{difficulty}} level containing exactly {{count}} questions that thoroughly test both theoretical understanding and practical application of the material.

Instructions:
1. Generate exactly {{count}} questions distributed across different cognitive levels (recall, understanding, application, analysis)
2. Include real-world scenarios and case studies relevant to the resource content
3. Scale question complexity appropriately for {{difficulty}} level
4. For each question, provide:
   - Clear question text
   - Correct answer clearly marked
   - Detailed explanation for both correct and incorrect answers
5. Distribute questions across these types: true-false, fill-in-blank, single-choice
6. Include estimated completion time based on question count and difficulty

Prioritize quality and relevance over quantity. Each question must directly relate to material covered in the chapter.

Expected JSON Structure:
{
  "title": "Quiz Title",
  "description": "Quiz description",
  "questions": [
    {
      "text": "Question text",
      "type": "multiple_choice",
      "options": [
        {
          "label": "Option A",
          "value": "Option A",
          "isCorrect": true
        },
        {
          "label": "Option B",
          "value": "Option B",
          "isCorrect": false
        },
        {
          "label": "Option C",
          "value": "Option C",
          "isCorrect": false
        },
        {
          "label": "Option D",
          "value": "Option D",
          "isCorrect": false
        }
      ],
      "explanation": "Why this answer is correct",
      "difficulty": "{{difficulty}}",
      "order": 1
    }
  ]
}`
    );

    this.templates.set(
      'questions',
      `You are an AI assessment expert specializing in creating targeted questions. Your task is to generate exactly {{count}} questions of type "{{questionType}}" for the resource titled "{{title}}" at a {{difficulty}} difficulty level.

Instructions:
1. Generate exactly {{count}} questions.
2. All questions must be of the type: {{questionType}}.
3. All questions must be presented in a formal, standard exam format. Do not reference specific page numbers, sections, or paragraphs from the source material; questions should be self-contained.
4. Scale the complexity and depth of the questions to match the {{difficulty}} level.
5. Ensure every question is directly derived from the provided content. Do not use external knowledge.
6. For each question, you must provide:
   - The question text.
   - Answer options (if applicable to the question type).
   - The correct answer, clearly identified.
   - A concise but thorough explanation of why the answer is correct.
7. Vary the position of the correct answer among the options to avoid creating a predictable pattern.

Prioritize clarity, accuracy, and relevance to the source material.

Expected JSON Structure:
{
  "questions": [
    {
      "text": "Question text",
      "type": "{{questionType}}",
      "options": [
        {
          "label": "Option A",
          "value": "Option A",
          "isCorrect": true
        }
      ],
      "explanation": "Why this answer is correct",
      "difficulty": "{{difficulty}}",
      "order": 1
    }
  ]
}`
    );
  }
}
