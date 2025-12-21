import { useState } from 'react';
import type { Transaction, Subscription } from '../types/transaction';
import type { AIInsightsResponse, AIInsight, AIProvider } from '../types/insights';
import { aggregateSpendingData, buildInsightsPrompt } from '../utils/insights-aggregator';
import { Card } from './ui/Card';

interface AIInsightsPanelProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  aiProvider: AIProvider | null;
  aiApiKey: string;
  onOpenSettings: () => void;
}

const INSIGHT_ICONS: Record<AIInsight['type'], string> = {
  saving_opportunity: '💰',
  spending_pattern: '📊',
  recommendation: '💡',
  warning: '⚠️',
  positive: '✅',
};

const INSIGHT_COLORS: Record<AIInsight['type'], string> = {
  saving_opportunity: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  spending_pattern: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  recommendation: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  warning: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  positive: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
};

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial advisor. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful financial advisor. Always respond with valid JSON.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseAIResponse(response: string): AIInsightsResponse {
  // Try to extract JSON from the response
  let jsonStr = response;

  // Handle markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      generatedAt: new Date().toISOString(),
      summary: parsed.summary || '',
      insights: (parsed.insights || []).map((insight: Partial<AIInsight>, index: number) => ({
        id: `insight-${index}`,
        type: insight.type || 'recommendation',
        title: insight.title || 'Insight',
        description: insight.description || '',
        potentialSavings: insight.potentialSavings,
        category: insight.category,
        priority: insight.priority || 3,
      })),
      rawResponse: response,
    };
  } catch {
    // If JSON parsing fails, create a simple insight from the text
    return {
      generatedAt: new Date().toISOString(),
      summary: 'Analysis complete',
      insights: [
        {
          id: 'insight-0',
          type: 'recommendation',
          title: 'Analysis',
          description: response,
          priority: 3,
        },
      ],
      rawResponse: response,
    };
  }
}

export function AIInsightsPanel({
  transactions,
  subscriptions,
  aiProvider,
  aiApiKey,
  onOpenSettings,
}: AIInsightsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);

  const isConfigured = aiProvider && aiApiKey;
  const hasData = transactions.length > 0;

  const handleGenerateInsights = async () => {
    if (!aiProvider || !aiApiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const aggregatedData = aggregateSpendingData(transactions, subscriptions);
      const prompt = buildInsightsPrompt(aggregatedData);

      let response: string;
      if (aiProvider === 'openai') {
        response = await callOpenAI(aiApiKey, prompt);
      } else if (aiProvider === 'anthropic') {
        response = await callAnthropic(aiApiKey, prompt);
      } else {
        response = await callGemini(aiApiKey, prompt);
      }

      const parsedInsights = parseAIResponse(response);
      setInsights(parsedInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  // Not configured state
  if (!isConfigured) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            AI insights not configured
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Get personalized spending insights and savings recommendations powered by AI. Configure
            your API key in settings to get started.
          </p>
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configure in settings
          </button>
        </div>
      </Card>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No transaction data
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Import your bank transactions to get AI-powered spending insights and recommendations.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with generate button */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI spending insights</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by {aiProvider === 'openai' ? 'OpenAI GPT-4o mini' : aiProvider === 'anthropic' ? 'Claude 3.5 Haiku' : 'Gemini 2.0 Flash'}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {insights ? 'Regenerate' : 'Generate insights'}
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <Card variant="default" padding="md" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">Error generating insights</h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Insights results */}
      {insights && (
        <div className="space-y-4">
          {/* Summary */}
          {insights.summary && (
            <Card variant="elevated" padding="md">
              <p className="text-gray-700 dark:text-gray-300">{insights.summary}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Generated {new Date(insights.generatedAt).toLocaleString()}
              </p>
            </Card>
          )}

          {/* Individual insights */}
          <div className="grid gap-4 md:grid-cols-2">
            {insights.insights
              .sort((a, b) => b.priority - a.priority)
              .map((insight) => (
                <Card
                  key={insight.id}
                  variant="default"
                  padding="md"
                  className={`border ${INSIGHT_COLORS[insight.type]}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{INSIGHT_ICONS[insight.type]}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {insight.potentialSavings && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                            Save ~{insight.potentialSavings.toLocaleString()} SEK/month
                          </span>
                        )}
                        {insight.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {insight.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Initial state - no insights yet */}
      {!insights && !isLoading && !error && (
        <Card variant="default" padding="lg">
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click "Generate insights" to analyze your {transactions.length.toLocaleString()}{' '}
              transactions and get personalized recommendations.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
