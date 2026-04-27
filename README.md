# Chris' Overengineered Study Guide


## Getting Started

now hosted with github pages: https://leechr001.github.io/the-quizzler/

## Question Bank Format

The app expects a YAML file shaped like this:

```yaml
questions:
  - id: cardiac-cycle-01
    prompt: "Which event occurs during ventricular systole?"
    choices:
      - "Atrial contraction"
      - "Ventricular contraction"
      - "Passive ventricular filling"
      - "AV valves opening"
    correct_choice: 1
    explanation: "Ventricular systole is the contraction phase of the ventricles."
    citation:
      source_file: "lecture_05_cardiac_physiology.pdf"
      page: 12
    tags:
      - physiology
      - cardiac-cycle
```

Math can live directly inside normal text fields like `prompt`, `choices`, and `explanation`. The app typesets TeX automatically when those fields contain supported delimiters.

```yaml
questions:
  - id: integral-01
    prompt: 'What is $$\int_0^1 x^2\,dx$$?'
    choices:
      - '\(\frac{1}{2}\)'
      - '\(\frac{1}{3}\)'
      - '\(\frac{2}{3}\)'
      - '\(1\)'
    correct_choice: 1
    explanation: 'Use the power rule: $$\int_0^1 x^2\,dx = \left[\frac{x^3}{3}\right]_0^1 = \frac{1}{3}.$$'
    citation:
      source_file: "calculus_review_notes.pdf"
      page: 9
    tags:
      - calculus
      - integrals
```

### Required Fields

- `id`: unique string
- `prompt`: question text
- `choices`: array of exactly 4 answer strings
- `correct_choice`: zero-based index of the correct answer
- `explanation`: explanation shown after answering
- `citation.source_file`: filename for the source material
- `citation.page`: page number in the source material
- `tags`: one or more tags/topics

### YAML Notes

The app uses a built-in lightweight YAML parser so it can stay dependency-free and work locally.

- Use spaces, not tabs
- Use standard mappings and lists
- Quote strings that contain `:` or `#`
- Multi-line block scalars like `|` and `>` are not supported in this MVP
- For LaTeX-heavy strings, single-quoted YAML is usually the easiest option because backslashes do not need to be doubled


## Session Rules

- Questions are filtered by any selected tag
- No tags are selected by default; common tags are shown first, while narrow tags are available under specific tags or by search
- Choices are reshuffled every time a question appears
- Missed questions return on expanding gaps: after 1, then 4, then 10 other questions when enough other questions remain
- A missed question must be answered correctly 3 times in a row to leave the session
- Closing the browser resets the current session
