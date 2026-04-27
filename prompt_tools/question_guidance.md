# Question Guidance

Use these rules for LLM-generated ECE567 study questions. Optimize for learning value, coverage, and difficulty calibration.

## Priority Order

When rules compete, prefer them in this order:

1. Test a core course concept, theorem, update rule, or algorithm.
2. Keep the question fair by including any setup that is not standard course knowledge.
3. Make distractors difficult, plausible, and close in concept to the correct answer.
4. Use a deliberate mix of easy, medium, and hard questions.
5. Add formulas when they improve recall without giving away the answer.
6. Use computation only when it is calculator-free and concept-driven.
7. Keep coverage, tagging, and reuse patterns consistent.

## Format

Add each new preference as a separate guideline with:

- **Main Idea:** The rule in one or two direct sentences.
- **Use When:** When the rule applies.
- **Do:** Concrete actions to take.
- **Avoid:** Common failure modes.
- **Example:** A short example when helpful.

## 1. Use an Intentional Difficulty Mix

**Main Idea:** The bank should contain a real mix of easy, medium, and hard questions. Difficulty should come from conceptual precision, close distractors, and task form, not from missing setup or ugly arithmetic.

**Use When:** Writing new questions for a topic set, revising an existing bank, or deciding how much support to give in a prompt.

**Do:**

- Use a mix of support levels:
  - easy: more direct recall or identification
  - medium: include useful formula or assumption context
  - hard: require distinguishing close concepts, following a short chain of reasoning, or working through a self-contained setup
- Make some hard questions use forms such as `NOT` / `EXCEPT`, conclusion-to-assumption, richer setups, or short multi-step reasoning when those forms genuinely test the concept.
- Keep hard questions fair by providing the needed setup in the prompt.

**Avoid:**

- Making most questions medium or easy.
- Making difficulty come from hidden background knowledge.
- Using trick wording that adds confusion without testing understanding.
- Treating negative wording or long setups as automatically bad or automatically good.

**Example:**

```text
Easy: Which algorithm uses this update formula?
Medium: Given this update formula, what role does the target term play?
Hard: Which assumption would fail if this theorem's conclusion did not hold?
```

## 2. Add Helpful Formula Context

**Main Idea:** Include important formulas, variables, update rules, or definitions in the prompt when they improve recall without revealing the answer. Use the formula as context, then ask about its meaning, role, assumption, or consequence.

**Use When:** The topic involves a method, theorem, update rule, loss, bound, or algorithm where seeing the mathematical form helps learning.

**Do:**

- Include formulas that are central to the topic.
- Add just enough variable context to make the formula readable.
- Ask about interpretation, purpose, assumptions, or algorithmic role.

**Avoid:**

- Putting the answer directly in the prompt.
- Turning the prompt into a full explanation.
- Packing several unrelated formulas into one question.

**Example:**

```text
Given the double-Q target \(r+\alpha \tilde Q_2(x'',\arg\max_v \tilde Q_1(x'',v))\), what is the key idea of the double estimator introduced before double Q-learning?
```

## 3. Prefer Mathematical Expressions for Mathematical Answer Choices

**Main Idea:** When the answer itself is a mathematical expression, comparison, loss term, gradient, update component, or bound, write the choices in mathematical form rather than only describing them in words.

**Use When:** The learner is supposed to recognize or distinguish an expression such as a log-ratio term, Bellman target, KL term, gradient, constraint, or objective component.

**Do:**

- Prefer symbolic expressions when mathematical structure is the thing being tested.
- Keep notation parallel across all answer choices.
- Use enough symbols, subscripts, and arguments to make the comparison precise.
- Use prose only when notation would be genuinely less clear than the concept-level wording.

**Avoid:**

- Replacing an important expression with a vague verbal paraphrase.
- Mixing one symbolic option with mostly prose options when expression recognition is the goal.
- Hiding the exact mathematical difference the learner is supposed to notice.

**Example:**

Weak:

```text
Prompt: What comparison is made inside the DPO log-sigmoid term?

Choice:
- The policy-reference log ratio for the preferred response minus that ratio for the rejected response
```

Better:

```text
Prompt: What comparison is made inside the DPO log-sigmoid term?

Choice:
- \(\log\frac{\pi_\theta(y^+|x)}{\pi_{\mathrm{ref}}(y^+|x)}-\log\frac{\pi_\theta(y^-|x)}{\pi_{\mathrm{ref}}(y^-|x)}\)
```

## 4. Include Formula-Recognition Questions for Major Algorithms

**Main Idea:** For each major algorithm in scope whose formula is important, include at least one question that shows the update, objective, loss, or selection rule and asks the learner to identify the algorithm.

**Use When:** The topic is an algorithm with a recognizable Bellman backup, update rule, objective, loss, or selection formula.

**Do:**

- Include at least one question of the form "Which algorithm uses this formula?"
- Use the standard formula or a lightly annotated version of it.
- Keep the task to identification, not derivation.
- Use answer choices that are other algorithms the learner is expected to know.

**Avoid:**

- Omitting the key formula when it is central to the method.
- Combining several algorithm-identification tasks into one prompt.
- Using an obscure variant that no longer works as a recognition question.

**Example:**

```text
Which algorithm uses the update \(Q(x,u)\leftarrow Q(x,u)+\beta[r+\alpha\max_v Q(x'',v)-Q(x,u)]\)?
```

## 5. Write Lemma and Theorem Questions in Both Directions

**Main Idea:** For lemmas, theorems, and standard guarantees, use both `assumptions -> conclusion` and `conclusion -> assumptions` question forms. The default is assumptions-to-conclusion, but some harder questions should reverse the direction.

**Use When:** The topic is a lemma, theorem, fixed-point result, regret bound, performance identity, or convergence statement.

**Do:**

- Frequently ask for the conclusion given the assumptions.
- Also include some harder questions that ask which assumption is needed for a stated conclusion, or which conclusion follows from a partially stated result.
- Keep the assumptions concise but sufficient.

**Avoid:**

- Asking only for theorem names when the structure of the result matters more.
- Omitting the assumptions entirely.
- Mixing several different results into one question.

**Example:**

```text
Assume \(T\) is a contraction on a complete metric space. What conclusion does the contraction mapping theorem give?
```

```text
Which assumption is essential for concluding that repeated application of \(T\) converges to a unique fixed point?
```

## 6. Keep Topic Coverage Exact and Reuse Concepts in Distinct Forms

**Main Idea:** When the user gives a topic list and a target count, cover each topic evenly. Reusing a concept is fine, but repeated questions should differ in form or what they test, not just in wording.

**Use When:** The user provides an explicit topic list, a target number of questions per topic, or a request to expand coverage.

**Do:**

- Match the requested number of questions per topic.
- Track coverage so no topic is skipped or overrepresented.
- Reuse important concepts across different forms such as identification, interpretation, computation, assumptions-to-conclusion, conclusion-to-assumptions, or application.
- Use IDs and tags that make grouping easy to review later.

**Avoid:**

- Drifting toward familiar topics.
- Losing count in long topic lists.
- Writing near-duplicate questions that differ only by paraphrase.

**Example:**

```text
If the user asks for 5 questions per topic across 18 topics, generate exactly 90 new questions.
```

## 7. Use Hard-but-Fair Same-Family Distractors

**Main Idea:** Wrong answers should be difficult, plausible, and close in concept to the correct answer. If the prompt asks for a member of a specific concept family, the distractors should be other members of that same family.

**Use When:** Writing multiple-choice options for definitions, named conditions, algorithm steps, theorem parts, or any prompt that implies the answer type.

**Do:**

- Match distractor type to prompt type.
- Use sibling concepts, common confusions, or slightly-too-strong / slightly-too-weak statements.
- Let wrong answers teach nearby concepts rather than serving as obvious filler.
- Check that every choice fits the category named in the prompt.

**Avoid:**

- Mixing unrelated topics into the options.
- Using distractors that can be rejected without understanding the target concept.
- Writing sets where only one choice even belongs to the named category.

**Special Case:** Do not use bandit-related methods or terms as distractors in non-bandit questions. For this user, bandit references are giveaways rather than useful distractors.

**Example:**

```text
Prompt: Which KKT condition is written as \(\lambda_i g_i(x^*)=0\) for every inequality constraint?

Choices:
- Complementary slackness
- Stationarity
- Primal feasibility
- Dual feasibility
```

## 8. Avoid Hidden Dependence on Example-Specific Memory

**Main Idea:** Any knowledge not given in the prompt should be core course knowledge, not memory of a specific worked example, toy problem, or chapter setup.

**Use When:** Writing questions inspired by textbook examples, lecture demos, or special-case formulations.

**Do:**

- Ask about transferable course ideas.
- Include any special setup that the question truly depends on.
- Prefer questions about why a definition, state, update, or theorem is structured a certain way.

**Avoid:**

- Requiring recall of a niche example that is not itself important course content.
- Assuming example-specific notation with no setup.
- Testing memory of a story or application instead of the underlying concept.

**Example:**

Weak:

```text
In the rod-cutting formulation with transition \(x_{k+1}=x_k-u_k\), where \(u_k\) is the chosen cut length, what does state \(x_k\) mean?
```

Better:

```text
In dynamic programming, why is the state chosen so that the next state depends only on the current state and action?
```

## 9. Use Computation Questions Only for Easy, Concept-Driven, Often Symbolic Work

**Main Idea:** Computation questions are allowed when they can be done comfortably without a calculator and when the work directly tests a key concept. The best versions often use symbolic manipulation to check whether the learner knows how a theorem, update rule, or gradient expression is instantiated.

**Use When:** A symbolic derivation helps test an update rule, Bellman backup, gradient theorem, index calculation, or similar course concept.

**Do:**

- Keep the arithmetic simple and mentally manageable.
- Treat short symbolic derivations of the same scale as the canonical DPG example as still "simple" and "mentally manageable."
- Allow exact symbolic forms such as `\(\log 4\)` or `\(e^{-2}\)` when that avoids calculator work.
- Prefer symbolic computation when the important skill is applying the form of a theorem or gradient correctly.
- Tag these questions clearly with `computation` or an equally explicit arithmetic tag.
- Use the computation to test a key idea such as how an update works, which quantity changes, or how a policy/value expression is formed.
- Give all quantities needed to perform the calculation.

**Avoid:**

- Requiring a calculator.
- Converting naturally exact answers into decimal approximations.
- Using messy arithmetic or long chains of computation.
- Writing questions that are only arithmetic practice with little conceptual value.
- Treating computation as numeric plugging only when a symbolic form would better test the concept.

**Canonical Example:**

```text
Suppose the critic has closed form \(Q_w(x,u)=\left(\frac{1}{2}(x+wu)-1\right)^2\) and the parameterized actor has the form \(\mu_{\theta}(x)=\frac{1}{1+e^{-\theta x}}\). What is the deterministic policy gradient estimate over a length-\(K\) trajectory?
```

This is a strong model because it requires knowing the deterministic policy gradient theorem, applying the correct chain-rule structure, and carrying out only exact symbolic computation. It should also be treated as the benchmark for the most derivation-heavy question that still counts as "simple" and "mentally manageable."

## 10. Explanations Should Resolve Close Calls

**Main Idea:** When a question is hard or the distractors are very plausible, the explanation should do more than restate the correct answer. It should briefly explain why the correct choice is right and why the strongest distractor or distractors are wrong.

**Use When:** The question uses close same-family distractors, reversed theorem direction, negative wording, or a short chain of reasoning.

**Do:**

- Explain the key reason the correct answer is correct.
- Briefly address the most tempting wrong answer or answers.
- Use the explanation to sharpen the distinction between nearby concepts.

**Avoid:**

- Explanations that merely repeat the correct choice.
- Ignoring the likely misconception the question was designed to test.
- Writing long mini-lectures when one or two precise sentences would do.

**Example:**

```text
Weak duality says every dual feasible value is a lower bound on the primal optimum in a minimization problem. Equality is not guaranteed; that would require stronger conditions such as strong duality.
```
