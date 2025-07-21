// utils/markdownParser.js
// Simple markdown parser for React Native Text components

import React from 'react';
import { Text, View } from 'react-native';

// Parse markdown and return React Native components
export const parseMarkdownText = (text, baseStyle = {}, isUserMessage = false) => {
  if (!text || typeof text !== 'string') {
    return <Text style={baseStyle}>{text}</Text>;
  }

  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      elements.push(<View key={`space-${lineIndex}`} style={{ height: 8 }} />);
      return;
    }

    // Handle headings
    if (line.startsWith('####')) {
      elements.push(
        <Text
          key={lineIndex}
          style={[
            baseStyle,
            {
              fontSize: 15,
              fontWeight: '600',
              marginTop: 10,
              marginBottom: 4,
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {line.replace(/^####\s*/, '')}
        </Text>
      );
    } else if (line.startsWith('###')) {
      elements.push(
        <Text
          key={lineIndex}
          style={[
            baseStyle,
            {
              fontSize: 16,
              fontWeight: '600',
              marginTop: 12,
              marginBottom: 4,
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {line.replace(/^###\s*/, '')}
        </Text>
      );
    } else if (line.startsWith('##')) {
      elements.push(
        <Text
          key={lineIndex}
          style={[
            baseStyle,
            {
              fontSize: 18,
              fontWeight: '700',
              marginTop: 14,
              marginBottom: 6,
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {line.replace(/^##\s*/, '')}
        </Text>
      );
    } else if (line.startsWith('#')) {
      elements.push(
        <Text
          key={lineIndex}
          style={[
            baseStyle,
            {
              fontSize: 20,
              fontWeight: '700',
              marginTop: 16,
              marginBottom: 8,
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {line.replace(/^#\s*/, '')}
        </Text>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Handle bullet points
      const bulletText = line.replace(/^[-*]\s*/, '');
      const parts = parseInlineFormatting(bulletText, baseStyle, isUserMessage);
      elements.push(
        <View key={lineIndex} style={{ flexDirection: 'row', marginBottom: 4, marginLeft: 16 }}>
          <Text style={[baseStyle, { marginRight: 8, marginTop: 2 }]}>•</Text>
          <Text style={[baseStyle, { flex: 1 }]}>
            {parts}
          </Text>
        </View>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Handle numbered lists
      const numberMatch = line.match(/^(\d+)\.\s(.*)$/);
      if (numberMatch) {
        const [, number, listText] = numberMatch;
        const parts = parseInlineFormatting(listText, baseStyle, isUserMessage);
        elements.push(
          <View key={lineIndex} style={{ flexDirection: 'row', marginBottom: 4, marginLeft: 16 }}>
            <Text style={[baseStyle, { marginRight: 8, marginTop: 2, minWidth: 20 }]}>{number}.</Text>
            <Text style={[baseStyle, { flex: 1 }]}>
              {parts}
            </Text>
          </View>
        );
      }
    } else {
      // Handle regular text with bold formatting
      const parts = parseInlineFormatting(line, baseStyle, isUserMessage);
      elements.push(
        <Text key={lineIndex} style={[baseStyle, { marginBottom: 4 }]}>
          {parts}
        </Text>
      );
    }
  });

  return <View>{elements}</View>;
};

// Parse inline formatting like **bold**, *italic*, and `code`
const parseInlineFormatting = (text, baseStyle, isUserMessage) => {
  const parts = [];
  let currentIndex = 0;

  // Combined regex to find **bold**, *italic*, and `code`
  const formatRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add text before the formatted part
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    const fullMatch = match[1];
    const boldText = match[2];
    const italicText = match[3];
    const codeText = match[4];

    if (boldText) {
      // Bold text
      parts.push(
        <Text
          key={`bold-${match.index}`}
          style={[
            baseStyle,
            {
              fontWeight: '700',
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {boldText}
        </Text>
      );
    } else if (italicText) {
      // Italic text
      parts.push(
        <Text
          key={`italic-${match.index}`}
          style={[
            baseStyle,
            {
              fontStyle: 'italic',
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {italicText}
        </Text>
      );
    } else if (codeText) {
      // Code text
      parts.push(
        <Text
          key={`code-${match.index}`}
          style={[
            baseStyle,
            {
              fontFamily: 'monospace',
              backgroundColor: isUserMessage ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 4,
              fontSize: 14,
              color: isUserMessage ? '#FFFFFF' : '#111827',
            },
          ]}
        >
          {codeText}
        </Text>
      );
    }

    currentIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
};

// Alternative: Convert markdown to plain text (removes formatting)
export const stripMarkdown = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/^#{1,6}\s*/gm, '') // Remove heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
    .replace(/`(.*?)`/g, '$1') // Remove code markers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove link markdown, keep text
    .replace(/^[-*]\s*/gm, '') // Remove bullet points
    .replace(/^\d+\.\s*/gm, '') // Remove numbered list markers
    .trim();
};

// For use in MessagesList.js
export const renderFormattedMessage = (content, isUserMessage, textStyle) => {
  return parseMarkdownText(content, textStyle, isUserMessage);
};