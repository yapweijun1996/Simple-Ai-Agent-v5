/**
 * Chat Application - Modular JavaScript Implementation
 * This file contains multiple modules that work together to create a chat application
 * with AI integration (OpenAI/Gemini models).
 */

/**
 * SettingsManager Module - Handles all application settings
 * @module SettingsManager
 */
const SettingsManager = (function() {
    'use strict';
    
    // Private state
    let settings = { 
        streaming: false, 
        enableCoT: false, 
        showThinking: true 
    };
    
    /**
     * Updates the application settings
     * @param {Object} newSettings - The new settings to apply
     * @returns {Object} - The updated settings
     */
    function updateSettings(newSettings) {
        settings = { ...settings, ...newSettings };
        console.log('Chat settings updated:', settings);
        return getSettings();
    }
    
    /**
     * Gets the current settings
     * @returns {Object} - The current settings (copy to prevent direct modification)
     */
    function getSettings() {
        return { ...settings };
    }
    
    // Public API
    return {
        updateSettings,
        getSettings
    };
})();

/**
 * ChatHistoryManager Module - Manages chat history and token tracking
 * @module ChatHistoryManager
 */
const ChatHistoryManager = (function() {
    'use strict';
    
    // Private state
    let chatHistory = [];
    let totalTokens = 0;
    
    /**
     * Adds a message to the chat history
     * @param {string} role - The role (user/assistant)
     * @param {string} content - The message content
     */
    function addMessage(role, content) {
        chatHistory.push({ role, content });
    }
    
    /**
     * Gets the current chat history
     * @returns {Array} - Copy of the chat history
     */
    function getChatHistory() {
        return [...chatHistory];
    }
    
    /**
     * Updates the token count
     * @param {number} newTokens - Tokens to add to the total
     */
    function updateTokenCount(newTokens) {
        if (typeof newTokens === 'number') {
            totalTokens += newTokens;
            Utils.updateTokenDisplay(totalTokens);
        }
    }
    
    /**
     * Gets the total tokens used
     * @returns {number} - The total tokens used
     */
    function getTotalTokens() {
        return totalTokens;
    }
    
    /**
     * Clears the chat history
     */
    function clearHistory() {
        chatHistory = [];
    }
    
    // Public API
    return {
        addMessage,
        getChatHistory,
        updateTokenCount,
        getTotalTokens,
        clearHistory
    };
})();

/**
 * ResponseProcessor Module - Handles formatting and processing AI responses
 * @module ResponseProcessor
 */
const ResponseProcessor = (function() {
    'use strict';
    
    // Private state
    let lastThinkingContent = '';
    let lastAnswerContent = '';
    let isThinking = false;
    
    /**
     * Generates Chain of Thought prompting instructions
     * @param {string} message - The user message
     * @returns {string} - The CoT enhanced message
     */
    function enhanceWithCoT(message) {
        return `${message}\n\nI'd like you to use Chain of Thought reasoning. Please think step-by-step before providing your final answer. Format your response like this:
Thinking: [detailed reasoning process, exploring different angles and considerations]
Answer: [your final, concise answer based on the reasoning above]`;
    }
    
    /**
     * Processes the AI response to extract thinking and answer parts
     * @param {string} response - The raw AI response
     * @returns {Object} - Object with thinking and answer components
     */
    function processCoTResponse(response) {
        // Check if response follows the Thinking/Answer format
        const thinkingMatch = response.match(/Thinking:(.*?)(?=Answer:|$)/s);
        const answerMatch = response.match(/Answer:(.*?)$/s);
        
        if (thinkingMatch && answerMatch) {
            const thinking = thinkingMatch[1].trim();
            const answer = answerMatch[1].trim();
            
            // Update the last known content
            lastThinkingContent = thinking;
            lastAnswerContent = answer;
            
            return {
                thinking: thinking,
                answer: answer,
                hasStructuredResponse: true
            };
        } else if (response.startsWith('Thinking:') && !response.includes('Answer:')) {
            // Partial thinking (no answer yet)
            const thinking = response.replace(/^Thinking:/, '').trim();
            lastThinkingContent = thinking;
            
            return {
                thinking: thinking,
                answer: lastAnswerContent,
                hasStructuredResponse: true,
                partial: true,
                stage: 'thinking'
            };
        } else if (response.includes('Thinking:') && !thinkingMatch) {
            // Malformed response (partial reasoning)
            const thinking = response.replace(/^.*?Thinking:/s, 'Thinking:');
            
            return {
                thinking: thinking.replace(/^Thinking:/, '').trim(),
                answer: '',
                hasStructuredResponse: false,
                partial: true
            };
        }
        
        // If not properly formatted, return the whole response as the answer
        return {
            thinking: '',
            answer: response,
            hasStructuredResponse: false
        };
    }
    
    /**
     * Extract and update partial CoT response during streaming
     * @param {string} fullText - The current streamed text
     * @returns {Object} - The processed response object
     */
    function processPartialCoTResponse(fullText) {
        if (fullText.includes('Thinking:') && !fullText.includes('Answer:')) {
            // Only thinking so far
            const thinking = fullText.replace(/^.*?Thinking:/s, '').trim();
            
            return {
                thinking: thinking,
                answer: '',
                hasStructuredResponse: true,
                partial: true,
                stage: 'thinking'
            };
        } else if (fullText.includes('Thinking:') && fullText.includes('Answer:')) {
            // Both thinking and answer are present
            const thinkingMatch = fullText.match(/Thinking:(.*?)(?=Answer:|$)/s);
            const answerMatch = fullText.match(/Answer:(.*?)$/s);
            
            if (thinkingMatch && answerMatch) {
                return {
                    thinking: thinkingMatch[1].trim(),
                    answer: answerMatch[1].trim(),
                    hasStructuredResponse: true,
                    partial: false
                };
            }
        }
        
        // Default case - treat as normal text
        return {
            thinking: '',
            answer: fullText,
            hasStructuredResponse: false
        };
    }
    
    /**
     * Formats the response for display based on settings
     * @param {Object} processed - The processed response with thinking and answer
     * @param {Object} settings - The current application settings
     * @returns {string} - The formatted response for display
     */
    function formatResponseForDisplay(processed, settings) {
        if (!settings.enableCoT || !processed.hasStructuredResponse) {
            return processed.answer;
        }

        // If showThinking is enabled, show both thinking and answer
        if (settings.showThinking) {
            if (processed.partial && processed.stage === 'thinking') {
                return `Thinking: ${processed.thinking}`;
            } else if (processed.partial) {
                return processed.thinking; // Just the partial thinking
            } else {
                return `Thinking: ${processed.thinking}\n\nAnswer: ${processed.answer}`;
            }
        } else {
            // Otherwise just show the answer (or thinking indicator if answer isn't ready)
            return processed.answer || '🤔 Thinking...';
        }
    }
    
    /**
     * Sets whether the AI is currently thinking
     * @param {boolean} thinking - Whether thinking is in progress
     */
    function setThinkingState(thinking) {
        isThinking = thinking;
    }
    
    /**
     * Gets whether the AI is currently thinking
     * @returns {boolean} - Whether thinking is in progress
     */
    function getThinkingState() {
        return isThinking;
    }
    
    /**
     * Resets the state for a new conversation
     */
    function resetState() {
        lastThinkingContent = '';
        lastAnswerContent = '';
        isThinking = false;
    }
    
    // Public API
    return {
        enhanceWithCoT,
        processCoTResponse,
        processPartialCoTResponse,
        formatResponseForDisplay,
        setThinkingState,
        getThinkingState,
        resetState
    };
})();

/**
 * ModelHandler Module - Handles model-specific API interactions
 * @module ModelHandler
 */
const ModelHandler = (function() {
    'use strict';
    
    /**
     * Handles OpenAI model message processing
     * @param {string} model - The OpenAI model to use
     * @param {string} message - The user message
     * @param {Array} chatHistory - The current chat history
     * @param {Object} settings - The current application settings
     * @param {Function} updateUICallback - Callback to update UI with response
     * @returns {Promise} - Promise resolving to the response
     */
    async function handleOpenAIMessage(model, message, chatHistory, settings, updateUICallback) {
        if (settings.streaming) {
            return handleOpenAIStreaming(model, message, chatHistory, settings, updateUICallback);
        } else {
            return handleOpenAINonStreaming(model, message, chatHistory, settings, updateUICallback);
        }
    }
    
    /**
     * Handles OpenAI streaming requests
     * @private
     */
    async function handleOpenAIStreaming(model, message, chatHistory, settings, updateUICallback) {
        const aiMsgElement = UIController.createEmptyAIMessage();
        let streamedResponse = '';
        
        try {
            // Start thinking indicator if CoT is enabled
            if (settings.enableCoT) {
                ResponseProcessor.setThinkingState(true);
                UIController.updateMessageContent(aiMsgElement, '🤔 Thinking...');
            }
            
            // Process streaming response
            const fullReply = await ApiService.streamOpenAIRequest(
                model, 
                chatHistory,
                (chunk, fullText) => {
                    streamedResponse = fullText;
                    
                    if (settings.enableCoT) {
                        // Process the streamed response for CoT
                        const processed = ResponseProcessor.processPartialCoTResponse(fullText);
                        
                        // Only show "Thinking..." if we're still waiting
                        if (ResponseProcessor.getThinkingState() && fullText.includes('Answer:')) {
                            ResponseProcessor.setThinkingState(false);
                        }
                        
                        // Format according to current stage and settings
                        const displayText = ResponseProcessor.formatResponseForDisplay(processed, settings);
                        UIController.updateMessageContent(aiMsgElement, displayText);
                    } else {
                        UIController.updateMessageContent(aiMsgElement, fullText);
                    }
                }
            );
            
            // Process response for CoT if enabled
            if (settings.enableCoT) {
                const processed = ResponseProcessor.processCoTResponse(fullReply);
                
                // Add thinking to debug console if available
                if (processed.thinking) {
                    console.log('AI Thinking:', processed.thinking);
                }
                
                // Update UI with appropriate content based on settings
                const displayText = ResponseProcessor.formatResponseForDisplay(processed, settings);
                UIController.updateMessageContent(aiMsgElement, displayText);
                
                // Add full response to chat history
                ChatHistoryManager.addMessage('assistant', fullReply);
            } else {
                // Add to chat history after completed
                ChatHistoryManager.addMessage('assistant', fullReply);
            }
            
            // Get token usage
            const tokenCount = await ApiService.getTokenUsage(model, ChatHistoryManager.getChatHistory());
            if (tokenCount) {
                ChatHistoryManager.updateTokenCount(tokenCount);
            }
            
            return fullReply;
        } catch (err) {
            UIController.updateMessageContent(aiMsgElement, 'Error: ' + err.message);
            throw err;
        } finally {
            ResponseProcessor.setThinkingState(false);
        }
    }
    
    /**
     * Handles OpenAI non-streaming requests
     * @private
     */
    async function handleOpenAINonStreaming(model, message, chatHistory, settings, updateUICallback) {
        try {
            const result = await ApiService.sendOpenAIRequest(model, chatHistory);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            // Update token usage
            if (result.usage && result.usage.total_tokens) {
                ChatHistoryManager.updateTokenCount(result.usage.total_tokens);
            }
            
            // Process response
            const reply = result.choices[0].message.content;
            
            if (settings.enableCoT) {
                const processed = ResponseProcessor.processCoTResponse(reply);
                
                // Add thinking to debug console if available
                if (processed.thinking) {
                    console.log('AI Thinking:', processed.thinking);
                }
                
                // Add the full response to chat history
                ChatHistoryManager.addMessage('assistant', reply);
                
                // Show appropriate content in the UI based on settings
                const displayText = ResponseProcessor.formatResponseForDisplay(processed, settings);
                UIController.addMessage('ai', displayText);
            } else {
                ChatHistoryManager.addMessage('assistant', reply);
                UIController.addMessage('ai', reply);
            }
            
            return reply;
        } catch (err) {
            throw err;
        }
    }
    
    /**
     * Handles Gemini model message processing
     * @param {string} model - The Gemini model to use
     * @param {string} message - The user message
     * @param {Array} chatHistory - The current chat history
     * @param {Object} settings - The current application settings  
     * @param {Function} updateUICallback - Callback to update UI with response
     * @returns {Promise} - Promise resolving to the response
     */
    async function handleGeminiMessage(model, message, chatHistory, settings, updateUICallback) {
        if (settings.streaming) {
            return handleGeminiStreaming(model, message, chatHistory, settings, updateUICallback);
        } else {
            return handleGeminiNonStreaming(model, message, chatHistory, settings, updateUICallback);
        }
    }
    
    /**
     * Handles Gemini streaming requests
     * @private
     */
    async function handleGeminiStreaming(model, message, chatHistory, settings, updateUICallback) {
        const aiMsgElement = UIController.createEmptyAIMessage();
        let streamedResponse = '';
        
        try {
            // Start thinking indicator if CoT is enabled
            if (settings.enableCoT) {
                ResponseProcessor.setThinkingState(true);
                UIController.updateMessageContent(aiMsgElement, '🤔 Thinking...');
            }
            
            // Process streaming response
            const fullReply = await ApiService.streamGeminiRequest(
                model,
                chatHistory,
                "", // message already defined in chatHistory, so pass empty string to avoid duplication.
                (chunk, fullText) => {
                    streamedResponse = fullText;
                    
                    if (settings.enableCoT) {
                        // Process the streamed response for CoT
                        const processed = ResponseProcessor.processPartialCoTResponse(fullText);
                        
                        // Only show "Thinking..." if we're still waiting
                        if (ResponseProcessor.getThinkingState() && fullText.includes('Answer:')) {
                            ResponseProcessor.setThinkingState(false);
                        }
                        
                        // Format according to current stage and settings
                        const displayText = ResponseProcessor.formatResponseForDisplay(processed, settings);
                        UIController.updateMessageContent(aiMsgElement, displayText);
                    } else {
                        UIController.updateMessageContent(aiMsgElement, fullText);
                    }
                }
            );
            
            // Process response for CoT if enabled
            if (settings.enableCoT) {
                const processed = ResponseProcessor.processCoTResponse(fullReply);
                
                // Add thinking to debug console if available
                if (processed.thinking) {
                    console.log('AI Thinking:', processed.thinking);
                }
                
                // Update UI with appropriate content based on settings
                const displayText = ResponseProcessor.formatResponseForDisplay(processed, settings);
                UIController.updateMessageContent(aiMsgElement, displayText);
                
                // Add full response to chat history
                ChatHistoryManager.addMessage('assistant', fullReply);
            } else {
                // Add to chat history after completed
                ChatHistoryManager.addMessage('assistant', fullReply);
            }
            
            // Get token usage
            const tokenCount = await ApiService.getTokenUsage(model, ChatHistoryManager.getChatHistory());
            if (tokenCount) {
                ChatHistoryManager.updateTokenCount(tokenCount);
            }
            
            return fullReply;
        } catch (err) {
            UIController.updateMessageContent(aiMsgElement, 'Error: ' + err.message);
            throw err;
        } finally {
            ResponseProcessor.setThinkingState(false);
        }
    }
    
    /**
     * Handles Gemini non-streaming requests
     * @private
     */
    async function handleGeminiNonStreaming(model, message, chatHistory, settings, updateUICallback) {
        try {
            const session = ApiService.createGeminiSession(model);
            const result = await session.sendMessage(message, chatHistory);
            
            // Update token usage if available
            if (result.usageMetadata && typeof result.usageMetadata.totalTokenCount === 'number') {
                ChatHistoryManager.updateTokenCount(result.usageMetadata.totalTokenCount);
            }
            
            // Process response
            const candidate = result.candidates[0];
            let textResponse = '';
            
            if (candidate.content.parts) {
                textResponse = candidate.content.parts.map(p => p.text).join(' ');
            } else if (candidate.content.text) {
                textResponse = candidate.content.text;
            }
            
            if (settings.enableCoT) {
                const processed = ResponseProcessor.processCoTResponse(textResponse);
                
                // Add thinking to debug console if available
                if (processed.thinking) {
                    console.log('AI Thinking:', processed.thinking);
                }
                
                // Add the full response to chat history
                ChatHistoryManager.addMessage('assistant', textResponse);
                
                // Show appropriate content in the UI based on settings
                const displayText = ResponseProcessor.formatResponseForDisplay(processed, settings);
                UIController.addMessage('ai', displayText);
            } else {
                ChatHistoryManager.addMessage('assistant', textResponse);
                UIController.addMessage('ai', textResponse);
            }
            
            return textResponse;
        } catch (err) {
            throw err;
        }
    }

    // Public API
    return {
        handleOpenAIMessage,
        handleGeminiMessage
    };
})();

/**
 * Chat Controller Module - Main orchestration module for the chat application
 * Coordinates between UI, API, and other modules
 * @module ChatController
 */
const ChatController = (function() {
    'use strict';

    /**
     * Initializes the chat controller
     * @param {Object} initialSettings - Initial settings for the chat
     */
    function init(initialSettings) {
        if (initialSettings) {
            SettingsManager.updateSettings(initialSettings);
        }
        
        // Set up event handlers through UI controller
        UIController.setupEventHandlers(sendMessage);
    }

    /**
     * Updates the settings
     * @param {Object} newSettings - The new settings
     */
    function updateSettings(newSettings) {
        return SettingsManager.updateSettings(newSettings);
    }

    /**
     * Gets the current settings
     * @returns {Object} - The current settings
     */
    function getSettings() {
        return SettingsManager.getSettings();
    }

    /**
     * Sends a message to the AI and handles the response
     */
    async function sendMessage() {
        const message = UIController.getUserInput();
        if (!message) return;
        
        // Reset the response processor state
        ResponseProcessor.resetState();
        
        // Get current settings
        const settings = SettingsManager.getSettings();
        
        // Add user message to UI and chat history
        UIController.addMessage('user', message);
        UIController.clearUserInput();
        
        // Add message to chat history
        ChatHistoryManager.addMessage('user', message);
        
        // Apply CoT formatting if enabled
        const enhancedMessage = settings.enableCoT ? 
            ResponseProcessor.enhanceWithCoT(message) : message;
        
        // Get the selected model
        const selectedModel = UIController.getSelectedModel();
        
        try {
            if (selectedModel.startsWith('gpt')) {
                await ModelHandler.handleOpenAIMessage(
                    selectedModel, 
                    enhancedMessage, 
                    ChatHistoryManager.getChatHistory(),
                    settings
                );
            } else {
                await ModelHandler.handleGeminiMessage(
                    selectedModel, 
                    enhancedMessage, 
                    ChatHistoryManager.getChatHistory(),
                    settings
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            UIController.addMessage('ai', 'Error: ' + error.message);
        }
    }

    /**
     * Gets the current chat history
     * @returns {Array} - The chat history
     */
    function getChatHistory() {
        return ChatHistoryManager.getChatHistory();
    }

    /**
     * Gets the total tokens used
     * @returns {number} - The total tokens used
     */
    function getTotalTokens() {
        return ChatHistoryManager.getTotalTokens();
    }

    // Public API
    return {
        init,
        updateSettings,
        getSettings,
        sendMessage,
        getChatHistory,
        getTotalTokens
    };
})(); 