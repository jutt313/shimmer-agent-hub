
// Secure expression parser without eval or new Function
export class SecureExpressionParser {
  private allowedOperators = ['==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'];

  constructor() {}

  evaluateExpression(expression: string, variables: Record<string, any>): boolean {
    try {
      console.log('🔍 Evaluating expression securely:', expression);
      
      // Sanitize and validate expression first
      const sanitized = this.sanitizeExpression(expression);
      
      // Parse into AST tokens
      const tokens = this.tokenize(sanitized);
      
      // Evaluate using AST traversal (no eval/new Function)
      const result = this.evaluateTokens(tokens, variables);
      
      console.log('✅ Secure evaluation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Secure expression evaluation failed:', error);
      return false;
    }
  }

  private sanitizeExpression(expression: string): string {
    // Remove any potentially dangerous patterns
    const forbidden = [
      'function', 'eval', 'constructor', 'prototype', 'window', 'document',
      'process', 'require', 'import', 'export', '__proto__', 'this', 'setTimeout',
      'setInterval', 'fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage',
      'sessionStorage', 'indexedDB', 'navigator', 'location', 'history'
    ];
    
    const lower = expression.toLowerCase();
    for (const word of forbidden) {
      if (lower.includes(word)) {
        throw new Error(`Forbidden keyword in expression: ${word}`);
      }
    }
    
    // Only allow safe characters for expressions
    if (!/^[a-zA-Z0-9\s\.\[\]"'<>=!&|()_-]+$/.test(expression)) {
      throw new Error('Invalid characters in expression');
    }
    
    return expression.trim();
  }

  private tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      
      if (!inString && (char === '"' || char === "'")) {
        if (current.trim()) {
          tokens.push(this.createToken(current.trim()));
          current = '';
        }
        inString = true;
        stringChar = char;
        current = char;
      } else if (inString && char === stringChar) {
        current += char;
        tokens.push(this.createToken(current));
        current = '';
        inString = false;
        stringChar = '';
      } else if (inString) {
        current += char;
      } else if (/\s/.test(char)) {
        if (current.trim()) {
          tokens.push(this.createToken(current.trim()));
          current = '';
        }
      } else if (['(', ')'].includes(char)) {
        if (current.trim()) {
          tokens.push(this.createToken(current.trim()));
          current = '';
        }
        tokens.push({ type: 'operator', value: char });
      } else if (this.isOperatorChar(char)) {
        if (current.trim()) {
          tokens.push(this.createToken(current.trim()));
          current = '';
        }
        // Handle multi-character operators
        let operator = char;
        if (i + 1 < expression.length) {
          const nextChar = expression[i + 1];
          const twoChar = char + nextChar;
          if (['==', '!=', '<=', '>=', '&&', '||'].includes(twoChar)) {
            operator = twoChar;
            i++; // Skip next character
          }
        }
        tokens.push({ type: 'operator', value: operator });
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      tokens.push(this.createToken(current.trim()));
    }
    
    return tokens.filter(token => token.value !== '');
  }

  private isOperatorChar(char: string): boolean {
    return ['=', '!', '<', '>', '&', '|'].includes(char);
  }

  private createToken(value: string): Token {
    // String literal
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return { type: 'string', value: value.slice(1, -1) };
    }
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return { type: 'number', value: parseFloat(value) };
    }
    
    // Boolean
    if (value === 'true') return { type: 'boolean', value: true };
    if (value === 'false') return { type: 'boolean', value: false };
    if (value === 'null') return { type: 'null', value: null };
    
    // Variable
    return { type: 'variable', value };
  }

  private evaluateTokens(tokens: Token[], variables: Record<string, any>): boolean {
    if (tokens.length === 0) return false;
    
    // Handle single token
    if (tokens.length === 1) {
      const token = tokens[0];
      if (token.type === 'boolean') return token.value as boolean;
      if (token.type === 'variable') return Boolean(variables[token.value as string]);
      return Boolean(token.value);
    }
    
    // Parse OR expressions (lowest precedence)
    return this.parseOrExpression(tokens, variables);
  }

  private parseOrExpression(tokens: Token[], variables: Record<string, any>): boolean {
    const parts = this.splitByOperator(tokens, '||');
    if (parts.length === 1) {
      return this.parseAndExpression(parts[0], variables);
    }
    
    return parts.some(part => this.parseAndExpression(part, variables));
  }

  private parseAndExpression(tokens: Token[], variables: Record<string, any>): boolean {
    const parts = this.splitByOperator(tokens, '&&');
    if (parts.length === 1) {
      return this.parseComparisonExpression(parts[0], variables);
    }
    
    return parts.every(part => this.parseComparisonExpression(part, variables));
  }

  private parseComparisonExpression(tokens: Token[], variables: Record<string, any>): boolean {
    // Handle parentheses
    if (tokens.length >= 3 && tokens[0].value === '(' && tokens[tokens.length - 1].value === ')') {
      return this.evaluateTokens(tokens.slice(1, -1), variables);
    }
    
    // Find comparison operator
    const comparisonOps = ['==', '!=', '<=', '>=', '<', '>'];
    let opIndex = -1;
    let operator = '';
    
    for (let i = 1; i < tokens.length - 1; i++) {
      if (tokens[i].type === 'operator' && comparisonOps.includes(tokens[i].value as string)) {
        opIndex = i;
        operator = tokens[i].value as string;
        break;
      }
    }
    
    if (opIndex === -1) {
      // No comparison operator, evaluate as boolean
      if (tokens.length === 1) {
        return this.getTokenValue(tokens[0], variables);
      }
      return false;
    }
    
    const leftTokens = tokens.slice(0, opIndex);
    const rightTokens = tokens.slice(opIndex + 1);
    
    const leftValue = this.getExpressionValue(leftTokens, variables);
    const rightValue = this.getExpressionValue(rightTokens, variables);
    
    return this.compareValues(leftValue, operator, rightValue);
  }

  private splitByOperator(tokens: Token[], operator: string): Token[][] {
    const parts: Token[][] = [];
    let current: Token[] = [];
    let depth = 0;
    
    for (const token of tokens) {
      if (token.value === '(') {
        depth++;
        current.push(token);
      } else if (token.value === ')') {
        depth--;
        current.push(token);
      } else if (depth === 0 && token.type === 'operator' && token.value === operator) {
        if (current.length > 0) {
          parts.push(current);
          current = [];
        }
      } else {
        current.push(token);
      }
    }
    
    if (current.length > 0) {
      parts.push(current);
    }
    
    return parts.length > 0 ? parts : [tokens];
  }

  private getExpressionValue(tokens: Token[], variables: Record<string, any>): any {
    if (tokens.length === 1) {
      return this.getTokenValue(tokens[0], variables);
    }
    
    // For multi-token expressions, take the first meaningful value
    for (const token of tokens) {
      if (token.type !== 'operator' || token.value === '(' || token.value === ')') {
        return this.getTokenValue(token, variables);
      }
    }
    
    return null;
  }

  private getTokenValue(token: Token, variables: Record<string, any>): any {
    switch (token.type) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'null':
        return token.value;
      case 'variable':
        return variables[token.value as string];
      default:
        return null;
    }
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
        return false;
    }
  }
}

interface Token {
  type: 'string' | 'number' | 'boolean' | 'null' | 'variable' | 'operator';
  value: any;
}
