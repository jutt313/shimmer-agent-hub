
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
  onReset?: () => void;
  className?: string;
}

export function SimpleCaptcha({ onVerify, onReset, className }: SimpleCaptchaProps) {
  const [challenge, setChallenge] = useState({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const generateChallenge = useCallback(() => {
    const operations = [
      { op: '+', calc: (a: number, b: number) => a + b },
      { op: '-', calc: (a: number, b: number) => a - b },
      { op: '×', calc: (a: number, b: number) => a * b }
    ];
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    
    // For subtraction, ensure positive result
    const num1 = operation.op === '-' ? Math.max(a, b) : a;
    const num2 = operation.op === '-' ? Math.min(a, b) : b;
    
    setChallenge({
      question: `${num1} ${operation.op} ${num2} = ?`,
      answer: operation.calc(num1, num2)
    });
    setUserAnswer('');
    setAttempts(0);
    setIsVerified(false);
  }, []);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userNum = parseInt(userAnswer);
    const isCorrect = userNum === challenge.answer;
    
    setAttempts(prev => prev + 1);
    
    if (isCorrect) {
      setIsVerified(true);
      onVerify(true);
    } else {
      onVerify(false);
      
      // Generate new challenge after 3 failed attempts
      if (attempts >= 2) {
        generateChallenge();
      }
    }
  };

  const handleReset = () => {
    generateChallenge();
    onReset?.();
  };

  if (isVerified) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="text-green-800 text-center">
          ✓ Verification successful
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">
          Security Verification Required
        </div>
        <div className="text-lg font-mono text-center bg-white p-3 rounded border">
          {challenge.question}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer"
            className="text-center"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!userAnswer}>
              Verify
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </form>
        {attempts > 0 && attempts < 3 && (
          <div className="text-sm text-red-600 text-center">
            Incorrect answer. {3 - attempts} attempts remaining.
          </div>
        )}
      </div>
    </div>
  );
}
