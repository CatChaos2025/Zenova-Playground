import React, { useState } from 'react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      
      setDisplay(String(newValue));
      setPrevValue(newValue);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const buttons = [
    ['C', '±', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <div style={{ 
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: '100%',
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '16px',
        borderRadius: '4px',
        fontSize: '24px',
        textAlign: 'right',
        fontFamily: 'monospace',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}>
        {display}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        flex: 1,
      }}>
        {buttons.flat().map((btn, i) => (
          <button
            key={i}
            onClick={() => {
              if (btn === 'C') clear();
              else if (btn === '=') performOperation('=');
              else if (btn === '.') inputDecimal();
              else if (['+', '-', '*', '/'].includes(btn)) performOperation(btn);
              else if (btn === '0') inputDigit('0');
              else if (!isNaN(Number(btn))) inputDigit(btn);
            }}
            style={{
              background: btn === '=' ? '#0078d4' : 
                         ['+', '-', '*', '/'].includes(btn) ? '#323232' : 
                         btn === 'C' ? '#c42b1c' : '#3b3b3b',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              gridColumn: btn === '0' ? 'span 2' : 'span 1',
            }}
            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
            onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}