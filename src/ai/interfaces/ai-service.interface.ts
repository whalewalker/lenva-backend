export interface GenerateOptions {
  prompt: string;
  input: string;
  temperature?: number;
  maxTokens?: number;
  autoChunk?: boolean;
  streaming?: boolean;
  tools?: any[];
}

export interface ChainOptions {
  chainType?: 'simple' | 'conversation' | 'retrieval' | 'custom';
  memory?: boolean;
  memoryKey?: string;
  customChain?: any;
}

export interface IAiService {
  generate<T = any>(options: GenerateOptions): Promise<T>;
  createChain(options: ChainOptions): Promise<any>;
  runChain<T = any>(chain: any, input: any): Promise<T>;
  streamGenerate(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
  healthCheck(): Promise<boolean>;
}

export interface IAggregatedAiService {
  generate<T = any>(options: GenerateOptions, provider?: AIProvider): Promise<T>;
  createChain(options: ChainOptions, provider?: AIProvider): Promise<any>;
  runChain<T = any>(chain: any, input: any, provider?: AIProvider): Promise<T>;
  streamGenerate(options: GenerateOptions, provider?: AIProvider): AsyncGenerator<string, void, unknown>;
  healthCheck(): Promise<Record<string, boolean>>;
}

export enum AIProvider {
  OPENROUTER = 'openrouter',
  MISTRAL = 'mistral',
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
}

export interface ModelConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}