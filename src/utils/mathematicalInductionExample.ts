
export const mathematicalInductionExample = `
## Mathematical Induction Proof

Problem: Prove that the sum of the first $(n)$ odd numbers is $(n^2)$.

Statement:
The sum of the first $(n)$ odd numbers is given by:

$$S(n) = 1 + 3 + 5 + \ldots + (2n-1) = n^2$$

### Solution: Proof by Mathematical Induction

#### Base Case:
For $(n = 1)$, the sum is $(1)$. According to the formula:

$$S(1) = 1^2 = 1$$

The base case holds true.

#### Inductive Step:
Assume the formula holds for some arbitrary positive integer $(k)$, i.e.,

$$S(k) = 1 + 3 + 5 + \ldots + (2k-1) = k^2$$

We need to show it holds for $(k+1)$, i.e.,

$$S(k+1) = 1 + 3 + 5 + \ldots + (2k-1) + (2(k+1)-1) = (k+1)^2$$

Using the inductive hypothesis:

$$S(k+1) = S(k) + (2(k+1)-1) = k^2 + (2k + 1)$$

Simplify the right-hand side:

$$= k^2 + 2k + 1$$

$$= (k+1)^2$$

#### Conclusion:
By the principle of mathematical induction, the formula $(S(n) = n^2)$ is true for all positive integers $(n)$.
`;
