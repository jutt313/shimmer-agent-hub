
// Safe expression parser for automation conditions
export class ExpressionParser {
  private allowedOperators = ['==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'];
  private allowedFunctions = ['includes', 'startsWith', 'endsWith', 'length'];

  constructor() {}

  evaluateExpression(expression: string, variables: Record<string, any>): boolean {
    try {
      console.log('🔍 Evaluating expression:', expression);
      
      // Sanitize and validate expression
      const sanitized = this.sanitizeExpression(expression);
      
      // Replace variables with their values
      const evaluable = this.replaceVariables(sanitized, variables);
      
      console.log('📝 Evaluable expression:', evaluable);
      
      // Use a safe evaluation method
      return this.safeEvaluate(evaluable);
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return false;
    }
  }

  private sanitizeExpression(expression: string): string {
    // Remove any potentially dangerous patterns
    const forbidden = [
      'function', 'eval', 'constructor', 'prototype', 'window', 'document',
      'process', 'require', 'import', 'export', '__proto__', 'this'
    ];
    
    const lower = expression.toLowerCase();
    for (const word of forbidden) {
      if (lower.includes(word)) {
        throw new Error(`Forbidden keyword in expression: ${word}`);
      }
    }
    
    // Only allow alphanumeric, spaces, and safe operators
    if (!/^[a-zA-Z0-9\s\.\[\]"'<>=!&|()_]+$/.test(expression)) {
      throw new Error('Invalid characters in expression');
    }
    
    return expression;
  }

  private replaceVariables(expression: string, variables: Record<string, any>): string {
    let result = expression;
    
    // Sort variables by length (longest first) to avoid partial replacements
    const sortedVars = Object.keys(variables).sort((a, b) => b.length - a.length);
    
    for (const varName of sortedVars) {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      const value = variables[varName];
      
      // Convert value to safe string representation
      const safeValue = this.valueToSafeString(value);
      result = result.replace(regex, safeValue);
    }
    
    return result;
  }

  private valueToSafeString(value: any): string {
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    } else if (Array.isArray(value)) {
      return JSON.stringify(value);
    } else if (value === null || value === undefined) {
      return 'null';
    } else {
      return JSON.stringify(value);
    }
  }

  private safeEvaluate(expression: string): boolean {
    // Simple recursive descent parser for basic comparisons
    const tokens = this.tokenize(expression);
    return this.parseOrExpression(tokens, 0).result;
  }

  private tokenize(expression: string): string[] {
    // Simple tokenizer for basic expressions
    const tokens: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      
      if (!inString && (char === '"' || char === "'")) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        inString = true;
        stringChar = char;
        current = char;
      } else if (inString && char === stringChar) {
        current += char;
        tokens.push(current);
        current = '';
        inString = false;
        stringChar = '';
      } else if (inString) {
        current += char;
      } else if (/\s/.test(char)) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else if (['(', ')'].includes(char)) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        tokens.push(char);
      } else if (char === '!' && i + 1 < expression.length && expression[i + 1] === '=') {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        tokens.push('!=');
        i++; // Skip next character
      } else if (['=', '<', '>', '&', '|'].includes(char)) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        
        // Handle multi-character operators
        if (i + 1 < expression.length) {
          const nextChar = expression[i + 1];
          if ((char === '=' && nextChar === '=') || 
              (char === '<' && nextChar === '=') ||
              (char === '>' && nextChar === '=') ||
              (char === '&' && nextChar === '&') ||
              (char === '|' && nextChar === '|')) {
            tokens.push(char + nextChar);
            i++; // Skip next character
            continue;
          }
        }
        
        if (char === '=' || char === '<' || char === '>') {
          tokens.push(char);
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      tokens.push(current.trim());
    }
    
    return tokens.filter(token => token.length > 0);
  }

  private parseOrExpression(tokens: string[], index: number): { result: boolean; nextIndex: number } {
    let left = this.parseAndExpression(tokens, index);
    
    while (left.nextIndex < tokens.length && tokens[left.nextIndex] === '||') {
      const right = this.parseAndExpression(tokens, left.nextIndex + 1);
      left = {
        result: left.result || right.result,
        nextIndex: right.nextIndex
      };
    }
    
    return left;
  }

  private parseAndExpression(tokens: string[], index: number): { result: boolean; nextIndex: number } {
    let left = this.parseComparisonExpression(tokens, index);
    
    while (left.nextIndex < tokens.length && tokens[left.nextIndex] === '&&') {
      const right = this.parseComparisonExpression(tokens, left.nextIndex + 1);
      left = {
        result: left.result && right.result,
        nextIndex: right.nextIndex
      };
    }
    
    return left;
  }

  private parseComparisonExpression(tokens: string[], index: number): { result: boolean; nextIndex: number } {
    if (index >= tokens.length) {
      throw new Error('Unexpected end of expression');
    }

    // Handle parentheses
    if (tokens[index] === '(') {
      const inner = this.parseOrExpression(tokens, index + 1);
      if (inner.nextIndex >= tokens.length || tokens[inner.nextIndex] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      return {
        result: inner.result,
        nextIndex: inner.nextIndex + 1
      };
    }

    // Parse left operand
    const left = this.parseValue(tokens[index]);
    
    if (index + 2 >= tokens.length) {
      // Simple boolean value
      return {
        result: Boolean(left),
        nextIndex: index + 1
      };
    }

    const operator = tokens[index + 1];
    const right = this.parseValue(tokens[index + 2]);

    const result = this.compareValues(left, operator, right);
    
    return {
      result,
      nextIndex: index + 3
    };
  }

  private parseValue(token: string): any {
    // String literal
    if ((token.startsWith('"') && token.endsWith('"')) || 
        (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1);
    }
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      return parseFloat(token);
    }
    
    // Boolean
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    
    // Array or object (JSON)
    if (token.startsWith('[') || token.startsWith('{')) {
      try {
        return JSON.parse(token);
      } catch {
        return token;
      }
    }
    
    return token;
  }

  private compareValues(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
}
