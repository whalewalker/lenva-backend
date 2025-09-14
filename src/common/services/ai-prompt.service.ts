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
    variables: Record<string, any>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const stringValue = String(value);
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), stringValue);
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
      `You are an expert educational content designer and curriculum developer with extensive experience in creating comprehensive, pedagogically sound learning programs. Your task is to analyze the provided educational material and create a comprehensive course that facilitates deep understanding and practical application.

**Core Educational Principles:**
- Design for progressive learning from foundational concepts to advanced applications
- Ensure content scaffolding where each chapter builds meaningfully on previous knowledge
- Create clear learning pathways that guide students through complex topics systematically
- Balance theoretical understanding with practical application and real-world relevance
- Incorporate diverse learning activities to accommodate different learning styles
- Ensure educational rigor without overwhelming students (avoid oversimplification while maintaining accessibility)

**Analysis Requirements:**
1. **Content Depth Analysis**: Thoroughly examine the provided material to understand its educational scope, complexity level, and key learning domains
2. **Learning Objective Extraction**: Identify both explicit and implicit learning outcomes that can be achieved through this material
3. **Conceptual Mapping**: Understand relationships between different concepts and how they should be sequenced for optimal learning
4. **Skill Development Focus**: Determine what practical skills and competencies students should develop through this course

**Course Structure Requirements:**
- **Title**: Create a descriptive, engaging title that accurately reflects the course content and learning outcomes
- **Description**: Write a comprehensive course description (minimum 200 words) that includes:
  - Clear explanation of what students will learn and achieve
  - Target audience and prerequisites
  - Unique value proposition of this course
  - Real-world applications and career relevance
- **Learning Objectives**: 3-6 specific, measurable learning outcomes using action verbs (analyze, create, evaluate, etc.)
- **Key Concepts**: Core theoretical and practical concepts that form the foundation of the course
- **Chapters**: Logically sequenced chapters with comprehensive content

**Chapter Development Guidelines:**
- Each chapter should be substantial (1000-3000 words) and include:
  - Clear introduction explaining the chapter's place in the overall learning journey
  - Core concepts explained with examples, analogies, and practical applications
  - Step-by-step explanations for complex processes or procedures
  - Real-world case studies or scenarios where applicable
  - Summary and connection to subsequent chapters
- Use proper Markdown formatting including headers, lists, code blocks, emphasis, and tables
- Include practical examples, exercises, or thought experiments to reinforce learning
- Ensure content progression is logical and supports mastery of learning objectives

**Quality Standards:**
- All content must be directly derived from the provided source material
- Educational content should promote critical thinking and problem-solving
- Avoid oversimplification while ensuring accessibility at the specified difficulty level: {{difficulty}}
- Include sufficient detail to support independent learning
- Maintain consistency in terminology and concepts throughout the course

Content to analyze: {{content}}

Generate a comprehensive course following the JSON schema structure with rich, educational content that transforms the source material into an effective learning experience.`
    );

    this.templates.set(
      'chapter',
      `You are an expert educational content writer specializing in creating comprehensive, engaging chapter content that promotes deep learning and understanding. Your task is to develop detailed chapter content for "{{title}}" at {{difficulty}} level.

**Educational Objectives:**
- Create content that facilitates genuine understanding, not just memorization
- Include sufficient detail and examples to support independent learning
- Design content that builds critical thinking and analytical skills
- Ensure proper educational scaffolding within the chapter
- Connect concepts to real-world applications and broader implications

**Chapter Development Standards:**
1. **Introduction (100-200 words)**: Set context, explain relevance, and outline what students will learn
2. **Core Content (800-2500 words)**: Detailed exploration of key concepts with:
   - Clear explanations with examples and analogies
   - Step-by-step breakdowns of complex processes
   - Multiple perspectives on important concepts
   - Practical applications and use cases
   - Connections to previous and future learning
3. **Summary and Reflection**: Reinforce key points and encourage deeper thinking

**Content Quality Requirements:**
- Use proper Markdown formatting (headers, lists, emphasis, code blocks, tables)
- Include relevant examples that illuminate concepts rather than just repeat them
- Provide sufficient depth appropriate for {{difficulty}} level:
  - Beginner: Focus on foundational understanding with clear explanations
  - Intermediate: Include applications, comparisons, and analytical thinking
  - Advanced: Explore nuances, edge cases, and complex implementations
- Maintain educational rigor while ensuring accessibility
- Include thought-provoking questions or scenarios to encourage reflection

**Learning Enhancement Elements:**
- Use analogies and metaphors to explain complex concepts
- Include practical exercises or thought experiments
- Provide multiple examples from different contexts
- Connect abstract concepts to concrete applications
- Anticipate and address common misconceptions

**Source Material**: Extract and develop content specifically relevant to "{{title}}" from: {{content}}

Create comprehensive chapter content that transforms the source material into an engaging, educational experience that promotes deep understanding and practical application.`
    );

    this.templates.set(
      'flashcards',
      `You are an expert in cognitive psychology and spaced repetition learning, specializing in creating effective flashcards that promote long-term retention and deep understanding. Generate exactly {{count}} high-quality flashcards for "{{title}}" at {{difficulty}} level.

**Learning Science Principles:**
- Design for active recall and testing effect
- Create cards that promote understanding, not just memorization
- Include contextual information to aid memory formation
- Vary question formats to engage different cognitive processes
- Build connections between concepts to strengthen memory networks

**Flashcard Quality Standards:**
1. **Front Side Design**:
   - Clear, specific questions that target one concept
   - Use varied question formats (definition, application, comparison, analysis)
   - Avoid ambiguous or overly broad questions
   - Include context when necessary for clarity

2. **Back Side Content**:
   - Concise but complete answers
   - Include key details without overwhelming information
   - Add brief explanations or examples when helpful
   - Connect to broader concepts or implications

3. **Educational Value**:
   - Target the most important concepts from the chapter
   - Progress from basic recall to application and analysis
   - Include both factual knowledge and conceptual understanding
   - Address common misconceptions or difficult concepts

**Difficulty Level Adaptation for {{difficulty}}:**
- **Beginner**: Focus on definitions, basic concepts, and fundamental relationships
- **Intermediate**: Include applications, comparisons, and cause-effect relationships
- **Advanced**: Explore nuances, edge cases, complex interactions, and critical analysis

**Content Distribution Strategy:**
- 40% core concepts and definitions
- 30% applications and examples
- 20% relationships and connections between ideas
- 10% challenging scenarios or edge cases

**Card Categories to Include**:
- Terminology and definitions
- Process steps and procedures
- Cause and effect relationships
- Comparisons and contrasts
- Real-world applications
- Problem-solving approaches

Source content for flashcard creation: {{content}}

Generate exactly {{count}} flashcards that will effectively support student learning and retention of the key concepts from this chapter.`
    );

    this.templates.set(
      'quiz',
      `You are an expert assessment designer with deep knowledge of educational evaluation and learning measurement. Create a comprehensive quiz for "{{title}}" containing exactly {{count}} questions that effectively assess student understanding at {{difficulty}} level.

**Assessment Design Principles:**
- Measure both factual knowledge and conceptual understanding
- Include questions that assess application, analysis, and evaluation skills
- Design questions that reveal misconceptions and knowledge gaps
- Create realistic scenarios that connect learning to practical applications
- Ensure questions are fair, unbiased, and directly related to learning objectives

**Question Quality Standards:**
1. **Clarity and Precision**:
   - Write clear, unambiguous questions
   - Use language appropriate for the target difficulty level
   - Avoid trick questions or unnecessarily complex wording
   - Ensure each question assesses a specific learning outcome

2. **Content Validity**:
   - Base all questions directly on the provided source material
   - Focus on the most important concepts and skills
   - Include both recall and higher-order thinking questions
   - Test understanding, not just memorization

3. **Answer Options** (for multiple choice):
   - Create plausible distractors based on common misconceptions
   - Ensure only one clearly correct answer
   - Vary the position of correct answers to avoid patterns
   - Make all options similar in length and complexity

**Question Type Distribution:**
- 40% Multiple choice (testing knowledge, comprehension, application)
- 30% True/False with explanation requirements
- 30% Short answer (requiring demonstration of understanding)

**Cognitive Level Targeting for {{difficulty}}:**
- **Beginner**: 60% recall/comprehension, 40% application
- **Intermediate**: 40% recall/comprehension, 50% application, 10% analysis
- **Advanced**: 30% recall/comprehension, 40% application, 30% analysis/evaluation

**Assessment Features:**
- Include realistic scenarios and case studies
- Test both theoretical knowledge and practical application
- Address common misconceptions and difficult concepts
- Provide comprehensive explanations for all answers
- Estimate appropriate time limits based on question complexity

**Question Categories to Cover:**
- Core concept understanding
- Practical applications
- Process and procedure knowledge
- Relationship and connection analysis
- Problem-solving and decision-making
- Real-world scenario application

Source material for quiz development: {{content}}

Create exactly {{count}} well-designed questions that effectively assess student learning and provide valuable feedback on their understanding of the material.`
    );

    this.templates.set(
      'questions',
      `You are an expert educational assessment specialist with advanced knowledge in question design and learning evaluation. Generate exactly {{count}} high-quality {{questionType}} questions for "{{title}}" at {{difficulty}} level that effectively assess student understanding and promote critical thinking.

**Question Design Excellence:**
- Create questions that assess genuine understanding, not just recall
- Design questions that encourage critical thinking and analysis
- Ensure questions are authentic and connect to real-world applications
- Build questions that reveal student reasoning processes
- Focus on the most educationally significant concepts from the material

**Question Type Specifications for {{questionType}}:**

**Multiple Choice Questions:**
- Write clear, specific question stems
- Include 4 options with one clearly correct answer
- Create plausible distractors based on common errors or misconceptions
- Ensure all options are grammatically consistent and similar in length
- Test understanding through application scenarios, not just recall

**True/False Questions:**
- Design statements that test important concepts or relationships
- Avoid trivial or overly obvious statements
- Include nuanced statements that require careful analysis
- Focus on conceptual understanding rather than memorization
- Require students to explain their reasoning

**Short Answer Questions:**
- Ask for explanations, analyses, or applications of concepts
- Design questions that allow multiple valid approaches
- Focus on processes, relationships, and implications
- Require demonstration of understanding through examples
- Ask students to connect concepts to broader themes

**Critical Thinking Integration:**
- Include analysis questions that require comparing and contrasting
- Ask students to evaluate scenarios or make judgments
- Require application of principles to new situations
- Test ability to identify cause-and-effect relationships
- Encourage synthesis of multiple concepts

**Difficulty Level Calibration for {{difficulty}}:**
- **Beginner**: Clear, straightforward questions focusing on fundamental concepts and basic applications
- **Intermediate**: Questions requiring connections between concepts, moderate analysis, and practical applications
- **Advanced**: Complex scenarios requiring synthesis, evaluation, critical analysis, and sophisticated reasoning

**Educational Quality Assurance:**
- Every question must be directly derived from the provided source material
- Questions should assess the most important learning outcomes
- Include adequate context and background information when needed
- Ensure questions are culturally neutral and accessible
- Design questions that provide diagnostic information about student understanding

**Question Enhancement Features:**
- Include realistic scenarios and case studies
- Connect abstract concepts to practical applications
- Address potential misconceptions or common errors
- Encourage deeper exploration of key concepts
- Build bridges between different areas of knowledge

Source material for question development: {{content}}

Generate exactly {{count}} expertly crafted {{questionType}} questions that will effectively assess and enhance student learning while maintaining the highest standards of educational assessment design.`
    );
  }
}
