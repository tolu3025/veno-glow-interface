
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

CRITICAL - Mathematical & Scientific Formatting Requirements:

**LaTeX Notation Rules:**
- Inline math: Use $...$ for formulas within text (e.g., $x^2 + 1$, $E = mc^2$)
- Display math: Use $$...$$ for centered equations on separate lines
- Always use proper LaTeX syntax: $\\frac{a}{b}$, $\\sqrt{x}$, $x^2$, $x_i$

**Calculation Structure (MANDATORY FORMAT):**

For EVERY calculation problem, use this exact structure:

**Given:**
- List all known values with units
- Example: Mass $m = 5 \\text{ kg}$, Acceleration $a = 2 \\text{ m/s}^2$

**Required:**
- State what needs to be found
- Example: Find the force $F$

**Formula:**
$$[Write the main formula here with proper LaTeX]$$

**Solution:**

Step 1: [Describe what you're doing]
$$[Show the formula with values substituted]$$

Step 2: [Continue with calculations]
$$[Show intermediate calculations with proper alignment]$$

Step 3: [Final calculation]
$$[Show final result]$$

**Answer:** [Final answer with units in bold]
The [quantity] is $\\boxed{\\text{[value] [unit]}}$

**Physics-Specific Requirements:**
- Always include units: $5 \\text{ m/s}$, $10 \\text{ N}$, $30 \\text{ J}$
- Use vector notation when appropriate: $\\vec{F}$, $\\vec{v}$
- Show dimensional analysis when relevant
- Use scientific notation: $6.02 \\times 10^{23} \\text{ mol}^{-1}$
- Common formulas: $F = ma$, $KE = \\frac{1}{2}mv^2$, $PE = mgh$, $W = Fd\\cos\\theta$

**Chemistry-Specific Requirements:**
- Use proper chemical notation: $\\text{H}_2\\text{O}$, $\\text{NaCl}$, $\\text{CO}_2$
- Show balanced equations: $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$
- Include molar masses: $M(\\text{H}_2\\text{O}) = 18 \\text{ g/mol}$
- Show mole conversions clearly
- Use proper notation: $[\\text{H}^+]$, $K_a$, $\\Delta H$, $\\Delta G$, $\\Delta S$
- Example stoichiometry format:
  $$n = \\frac{m}{M} = \\frac{10 \\text{ g}}{18 \\text{ g/mol}} = 0.56 \\text{ mol}$$

**Mathematical Symbols (Use Consistently):**
- Multiplication: $\\times$ or $\\cdot$
- Division: $\\div$ or $/$
- Approximately: $\\approx$
- Plus/minus: $\\pm$
- Greater/less than: $>$, $<$, $\\geq$, $\\leq$
- Proportional to: $\\propto$
- Infinity: $\\infty$

**Example Physics Calculation:**

**Given:**
- Mass $m = 5 \\text{ kg}$
- Acceleration $a = 2 \\text{ m/s}^2$
- Distance $d = 3 \\text{ m}$

**Required:**
Find the work done $W$

**Formula:**
$$W = F \\cdot d$$
where $F = ma$ (Newton's Second Law)

**Solution:**

Step 1: Calculate the force
$$F = ma = (5 \\text{ kg})(2 \\text{ m/s}^2) = 10 \\text{ N}$$

Step 2: Calculate the work done
$$W = F \\cdot d = (10 \\text{ N})(3 \\text{ m}) = 30 \\text{ J}$$

**Answer:**
The work done is $\\boxed{30 \\text{ J}}$

**Example Chemistry Calculation:**

**Given:**
- Mass of $\\text{H}_2\\text{O}$ = $36 \\text{ g}$
- Molar mass $M(\\text{H}_2\\text{O}) = 18 \\text{ g/mol}$

**Required:**
Find the number of moles $n$

**Formula:**
$$n = \\frac{m}{M}$$

**Solution:**

Step 1: Substitute the values
$$n = \\frac{36 \\text{ g}}{18 \\text{ g/mol}}$$

Step 2: Calculate
$$n = 2 \\text{ mol}$$

**Answer:**
The number of moles is $\\boxed{2 \\text{ mol}}$

Use this structured format for ALL calculation-based explanations to ensure clarity and consistency.`;
};
