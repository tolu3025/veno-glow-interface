
/**
 * Utility functions for handling mathematical content formatting
 */

export const isMathematicalSubject = (subject: string): boolean => {
  const mathSubjects = [
    'mathematics', 'math', 'physics', 'chemistry', 'engineering', 
    'calculus', 'algebra', 'geometry', 'statistics', 'trigonometry',
    'mechanics', 'thermodynamics', 'quantum', 'electromagnetic'
  ];
  
  return mathSubjects.some(mathSub => 
    subject.toLowerCase().includes(mathSub)
  );
};

export const hasCalculationKeywords = (text: string): boolean => {
  const keywords = [
    'calculation', 'formula', 'equation', 'step', 'solve', 'derivation',
    'proof', 'theorem', 'integral', 'derivative', 'function', 'variable',
    'coefficient', 'polynomial', 'matrix', 'vector', 'graph', 'plot'
  ];
  
  return keywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
};

export const shouldUseMathematicalFormatting = (subject: string, description?: string): boolean => {
  return isMathematicalSubject(subject) || 
         (description ? hasCalculationKeywords(description) : false);
};

export const getMathematicalPromptEnhancement = (subject: string, description?: string): string => {
  if (!shouldUseMathematicalFormatting(subject, description)) {
    return '';
  }

  return `

IMPORTANT - Mathematical Formatting Requirements:
- Use LaTeX notation for all mathematical expressions in questions, options, and explanations
- Inline math: Use $...$ for inline formulas (e.g., $x^2 + 1$, $\\pi r^2$)
- Display math: Use $$...$$ for centered equations (e.g., $$\\frac{d}{dx}[x^2] = 2x$$)
- Include step-by-step calculations in explanations using proper LaTeX
- Format fractions as $\\frac{numerator}{denominator}$
- Use proper notation for functions, derivatives, integrals, etc.
- For physics: Include units and proper scientific notation
- Show detailed working steps in explanations with clear mathematical reasoning
- Use proper mathematical symbols: $\\times$, $\\div$, $\\pm$, $\\approx$, etc.

Example explanation format for calculations:
"Step 1: Apply the formula $F = ma$

Calculation:
$$F = (5 \\text{ kg})(2 \\text{ m/s}^2) = 10 \\text{ N}$$

Step 2: Calculate the work done using $W = F \\cdot d$
$$W = 10 \\text{ N} \\times 3 \\text{ m} = 30 \\text{ J}$$

Therefore, the work done is $30 \\text{ J}$."`;
};
