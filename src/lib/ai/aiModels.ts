/**
 * AI Model Configuration and Client Factory
 * Supports multiple AI providers: Google Gemini, OpenAI, Anthropic
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIModel {
    id: string;
    name: string;
    provider: AIProvider;
    maxTokens: number;
    description: string;
}

// Available AI models
export const AI_MODELS: AIModel[] = [
    // Google Gemini models
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'gemini',
        maxTokens: 8192,
        description: 'Latest Gemini model - fastest and most efficient (Default)',
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini',
        maxTokens: 8192,
        description: 'Fast and efficient, great for most tasks',
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'gemini',
        maxTokens: 8192,
        description: 'Most capable Gemini model, best quality',
    },
    {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        provider: 'gemini',
        maxTokens: 8192,
        description: 'Experimental model with enhanced capabilities',
    },

    // OpenAI models
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        maxTokens: 16384,
        description: 'Latest GPT-4 optimized model, fast and powerful',
    },
    {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        maxTokens: 128000,
        description: 'GPT-4 with larger context window',
    },
    {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        description: 'Original GPT-4, most reliable',
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 16384,
        description: 'Fast and cost-effective',
    },

    // Anthropic models
    {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        maxTokens: 8192,
        description: 'Latest Claude, excellent at creative writing',
    },
    {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 4096,
        description: 'Most powerful Claude model',
    },
    {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 4096,
        description: 'Balanced performance and speed',
    },
];

// AI Client interface
export interface AIClient {
    generateContent(prompt: string): Promise<string>;
}

// Gemini client
class GeminiClient implements AIClient {
    private client: GoogleGenerativeAI;
    private modelId: string;

    constructor(apiKey: string, modelId: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelId = modelId;
    }

    async generateContent(prompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.modelId });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
}

// OpenAI client
class OpenAIClient implements AIClient {
    private client: OpenAI;
    private modelId: string;

    constructor(apiKey: string, modelId: string) {
        this.client = new OpenAI({ apiKey });
        this.modelId = modelId;
    }

    async generateContent(prompt: string): Promise<string> {
        const completion = await this.client.chat.completions.create({
            model: this.modelId,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        });
        return completion.choices[0]?.message?.content || '';
    }
}

// Anthropic client
class AnthropicClient implements AIClient {
    private client: Anthropic;
    private modelId: string;

    constructor(apiKey: string, modelId: string) {
        this.client = new Anthropic({ apiKey });
        this.modelId = modelId;
    }

    async generateContent(prompt: string): Promise<string> {
        const message = await this.client.messages.create({
            model: this.modelId,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const textContent = message.content.find(c => c.type === 'text');
        return textContent && 'text' in textContent ? textContent.text : '';
    }
}

// Factory function to create AI client
export function createAIClient(modelId: string, apiKey: string): AIClient {
    const model = AI_MODELS.find(m => m.id === modelId);

    if (!model) {
        throw new Error(`Unknown AI model: ${modelId}`);
    }

    switch (model.provider) {
        case 'gemini':
            return new GeminiClient(apiKey, modelId);
        case 'openai':
            return new OpenAIClient(apiKey, modelId);
        case 'anthropic':
            return new AnthropicClient(apiKey, modelId);
        default:
            throw new Error(`Unsupported AI provider: ${model.provider}`);
    }
}

// Get API key from user or environment
export async function getAPIKey(userId: string, provider: AIProvider): Promise<string | null> {
    const { prisma } = await import('@/lib/prisma');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            geminiApiKey: true,
            openaiApiKey: true,
            anthropicApiKey: true,
        },
    });

    if (!user) return null;

    switch (provider) {
        case 'gemini':
            return user.geminiApiKey || process.env.GEMINI_API_KEY || null;
        case 'openai':
            return user.openaiApiKey || process.env.OPENAI_API_KEY || null;
        case 'anthropic':
            return user.anthropicApiKey || process.env.ANTHROPIC_API_KEY || null;
        default:
            return null;
    }
}
