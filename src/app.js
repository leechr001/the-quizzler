const builtInQuestionBank = {
  label: "ECE 567",
  path: "question-bank-ECE567.yaml",
};

const maxCommonTags = 15;

const schemaExample = `questions:
  - id: unique-short-id
    prompt: 'What does \\(V_k(x)\\) represent?'
    choices:
      - "Choice A"
      - "Choice B"
      - "Choice C"
      - "Choice D"
    correct_choice: 0
    explanation: "One or two sentences explaining the answer."
    citation:
      source_file: "lecture_notes.pdf"
      page: 1
    tags:
      - topic
      - subtopic`;

const state = {
  bank: null,
  bankSourceName: "",
  bankStatus: {
    tone: "muted",
    message: "No question bank loaded yet.",
  },
  selectedTags: new Set(),
  tagSearch: "",
  session: null,
};

const elements = {};
let mathTypesetPromise = Promise.resolve();

document.addEventListener("DOMContentLoaded", () => {
  captureElements();
  bindEvents();
  elements.schemaPreview.textContent = schemaExample.trim();
  render();
});

function captureElements() {
  elements.bankFile = document.getElementById("bank-file");
  elements.bankStatus = document.getElementById("bank-status");
  elements.schemaPreview = document.getElementById("schema-preview");
  elements.loadEce567 = document.getElementById("load-ece-567");
  elements.selectAllTags = document.getElementById("select-all-tags");
  elements.clearTags = document.getElementById("clear-tags");
  elements.tagSearch = document.getElementById("tag-search");
  elements.tagList = document.getElementById("tag-list");
  elements.selectedCount = document.getElementById("selected-count");
  elements.startSession = document.getElementById("start-session");
  elements.quizTitle = document.getElementById("quiz-title");
  elements.sessionChip = document.getElementById("session-chip");
  elements.statMastered = document.getElementById("stat-mastered");
  elements.statReview = document.getElementById("stat-review");
  elements.statAttempts = document.getElementById("stat-attempts");
  elements.progressFill = document.getElementById("progress-fill");
  elements.quizEmpty = document.getElementById("quiz-empty");
  elements.quizWorkspace = document.getElementById("quiz-workspace");
  elements.questionBadge = document.getElementById("question-badge");
  elements.questionOrder = document.getElementById("question-order");
  elements.questionTags = document.getElementById("question-tags");
  elements.questionPrompt = document.getElementById("question-prompt");
  elements.questionCitation = document.getElementById("question-citation");
  elements.choiceList = document.getElementById("choice-list");
  elements.feedbackCard = document.getElementById("feedback-card");
  elements.feedbackIcon = document.getElementById("feedback-icon");
  elements.feedbackTitle = document.getElementById("feedback-title");
  elements.feedbackAnswer = document.getElementById("feedback-answer");
  elements.feedbackExplanation = document.getElementById("feedback-explanation");
  elements.feedbackReview = document.getElementById("feedback-review");
  elements.skipReview = document.getElementById("skip-review");
  elements.nextQuestion = document.getElementById("next-question");
  elements.completionCard = document.getElementById("completion-card");
  elements.completionMastered = document.getElementById("completion-mastered");
  elements.completionReviewNeeded = document.getElementById("completion-review-needed");
  elements.completionAttempts = document.getElementById("completion-attempts");
  elements.restartSession = document.getElementById("restart-session");
}

function bindEvents() {
  elements.bankFile.addEventListener("change", handleFileLoad);
  elements.loadEce567.addEventListener("click", loadBuiltInQuestionBank);
  elements.selectAllTags.addEventListener("click", selectAllTags);
  elements.clearTags.addEventListener("click", clearAllTags);
  elements.tagSearch.addEventListener("input", handleTagSearch);
  elements.startSession.addEventListener("click", startSession);
  elements.skipReview.addEventListener("click", skipReviewForCurrentQuestion);
  elements.nextQuestion.addEventListener("click", advanceSession);
  elements.restartSession.addEventListener("click", startSession);
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(event) {
  if (isTypingContext(event.target) || !state.session) {
    return;
  }

  if (state.session.answerState && event.key === "Enter") {
    event.preventDefault();
    advanceSession();
    return;
  }

  if (state.session.answerState) {
    return;
  }

  const keyMap = ["1", "2", "3", "4"];
  const selectedIndex = keyMap.indexOf(event.key);
  if (selectedIndex >= 0) {
    event.preventDefault();
    submitAnswer(selectedIndex);
  }
}

function isTypingContext(target) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName ? target.tagName.toLowerCase() : "";
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

async function handleFileLoad(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const text = await file.text();
  loadQuestionBank(text, file.name);
  elements.bankFile.value = "";
}

async function loadBuiltInQuestionBank() {
  try {
    setBankStatus(
      "muted",
      `Loading ${builtInQuestionBank.label} from ${builtInQuestionBank.path}...`,
    );

    const response = await fetch(builtInQuestionBank.path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load ${builtInQuestionBank.path} (${response.status}).`);
    }

    const text = await response.text();
    loadQuestionBank(text, builtInQuestionBank.path);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown loading error.";
    setBankStatus(
      "error",
      `Could not load ${builtInQuestionBank.label}. Serve the project with python3 -m http.server 4173, then open http://localhost:4173. ${detail}`,
    );
  }
}

function loadQuestionBank(sourceText, sourceName) {
  try {
    const parsed = parseYaml(sourceText);
    const bank = validateQuestionBank(parsed);
    state.bank = bank;
    state.bankSourceName = sourceName;
    state.selectedTags = new Set();
    state.tagSearch = "";
    elements.tagSearch.value = "";
    state.session = null;
    state.bankStatus = {
      tone: "success",
      message: `Loaded ${bank.questions.length} question${bank.questions.length === 1 ? "" : "s"} from ${sourceName}.`,
    };
  } catch (error) {
    state.bankStatus = {
      tone: "error",
      message: error instanceof Error ? error.message : "The question bank could not be loaded.",
    };
  }

  render();
}

function setBankStatus(tone, message) {
  state.bankStatus = { tone, message };
  render();
}

function render() {
  renderBankStatus();
  renderTags();
  renderSelectionSummary();
  renderSessionState();
}

function renderBankStatus() {
  elements.bankStatus.className = `status-card ${state.bankStatus.tone}`;

  if (!state.bank) {
    elements.bankStatus.textContent = state.bankStatus.message;
    return;
  }

  const tagText = `${state.bank.tags.length} tag${state.bank.tags.length === 1 ? "" : "s"}`;
  if (state.bankStatus.tone === "success") {
    elements.bankStatus.textContent = `${state.bankStatus.message} ${tagText} available.`;
    return;
  }

  elements.bankStatus.textContent = state.bankStatus.message;
}

function renderTags() {
  if (!state.bank) {
    elements.tagList.className = "tag-list empty";
    elements.tagList.textContent = "Load a question bank to choose tags.";
    elements.selectAllTags.disabled = true;
    elements.clearTags.disabled = true;
    elements.tagSearch.disabled = true;
    return;
  }

  elements.tagList.className = "tag-list";
  elements.tagList.textContent = "";
  elements.selectAllTags.disabled = false;
  elements.clearTags.disabled = false;
  elements.tagSearch.disabled = false;

  const tagItems = state.bank.tags.map((tag) => ({
    tag,
    count: state.bank.tagCounts.get(tag) || 0,
  }));
  const searchTerm = state.tagSearch.trim().toLowerCase();

  if (searchTerm) {
    const matchingTags = tagItems.filter(({ tag }) =>
      tag.toLowerCase().includes(searchTerm),
    );
    renderTagGroup(
      matchingTags.length ? "Matching tags" : "No matching tags",
      matchingTags,
      elements.tagList,
    );
    return;
  }

  const commonTags = tagItems.slice(0, maxCommonTags);
  const specificTags = tagItems.slice(maxCommonTags);

  renderTagGroup("Common tags", commonTags, elements.tagList);

  if (specificTags.length > 0) {
    const selectedSpecificCount = specificTags.filter(({ tag }) =>
      state.selectedTags.has(tag),
    ).length;
    const details = document.createElement("details");
    details.className = "tag-details";
    details.open = selectedSpecificCount > 0;

    const summary = document.createElement("summary");
    summary.textContent = `Specific tags (${specificTags.length})`;
    if (selectedSpecificCount > 0) {
      const selectedNote = document.createElement("span");
      selectedNote.className = "tag-summary-note";
      selectedNote.textContent = `${selectedSpecificCount} selected`;
      summary.appendChild(selectedNote);
    }

    const detailsBody = document.createElement("div");
    detailsBody.className = "tag-details-body";
    renderTagGroup(
      "Specific tags",
      specificTags,
      detailsBody,
      "These are useful for targeted review but often cover only one or two questions.",
    );

    details.append(summary, detailsBody);
    elements.tagList.appendChild(details);
  }
}

function renderTagGroup(title, tagItems, container, description = "") {
  const group = document.createElement("section");
  group.className = "tag-group";

  const heading = document.createElement("div");
  heading.className = "tag-group-heading";

  const titleElement = document.createElement("h3");
  titleElement.textContent = title;

  const countElement = document.createElement("span");
  countElement.textContent = `${tagItems.length} tag${tagItems.length === 1 ? "" : "s"}`;

  heading.append(titleElement, countElement);
  group.appendChild(heading);

  if (description) {
    const descriptionElement = document.createElement("p");
    descriptionElement.className = "tag-group-description";
    descriptionElement.textContent = description;
    group.appendChild(descriptionElement);
  }

  const chipList = document.createElement("div");
  chipList.className = "tag-chip-list";

  tagItems.forEach(({ tag, count }) => {
    chipList.appendChild(createTagButton(tag, count));
  });

  if (tagItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "tag-group-description";
    emptyMessage.textContent = "Try a different search term.";
    group.appendChild(emptyMessage);
  } else {
    group.appendChild(chipList);
  }

  container.appendChild(group);
}

function createTagButton(tag, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tag-chip${state.selectedTags.has(tag) ? " active" : ""}`;
  button.setAttribute("aria-pressed", state.selectedTags.has(tag) ? "true" : "false");
  button.addEventListener("click", () => toggleTag(tag));

  const name = document.createElement("span");
  name.textContent = tag;

  const countBadge = document.createElement("span");
  countBadge.className = "tag-count";
  countBadge.textContent = count;

  button.append(name, countBadge);
  return button;
}

function renderSelectionSummary() {
  const selectedQuestions = getSelectedQuestions();
  elements.selectedCount.textContent = `${selectedQuestions.length} question${selectedQuestions.length === 1 ? "" : "s"}`;
  elements.startSession.disabled = selectedQuestions.length === 0;
}

function renderSessionState() {
  const session = state.session;

  if (!session) {
    elements.quizTitle.textContent = "Study Session";
    elements.sessionChip.textContent = state.bank ? "Ready" : "Idle";
    elements.sessionChip.className = "session-chip";
    elements.statMastered.textContent = "0";
    elements.statReview.textContent = "0";
    elements.statAttempts.textContent = "0";
    elements.progressFill.style.width = "0%";
    elements.quizEmpty.classList.remove("hidden");
    elements.quizWorkspace.classList.add("hidden");
    elements.feedbackCard.classList.add("hidden");
    elements.completionCard.classList.add("hidden");
    queueMathTypeset([]);
    return;
  }

  const masteredCount = session.mastered.size;
  const reviewCount = session.reviewStates.size;
  const attempts = session.correctAttempts + session.wrongAttempts;
  const progress = session.selectedQuestionIds.length
    ? (masteredCount / session.selectedQuestionIds.length) * 100
    : 0;

  elements.statMastered.textContent = `${masteredCount}/${session.selectedQuestionIds.length}`;
  elements.statReview.textContent = `${reviewCount}`;
  elements.statAttempts.textContent = `${attempts}`;
  elements.progressFill.style.width = `${progress}%`;
  elements.quizEmpty.classList.add("hidden");

  if (session.completed) {
    elements.quizTitle.textContent = "Session Complete";
    elements.sessionChip.textContent = "Complete";
    elements.sessionChip.className = "session-chip complete";
    elements.quizWorkspace.classList.add("hidden");
    elements.feedbackCard.classList.add("hidden");
    renderCompletion();
    queueMathTypeset([]);
    return;
  }

  const currentQuestion = getCurrentQuestion();
  elements.quizTitle.textContent = `Studying ${session.selectedQuestionIds.length} selected question${session.selectedQuestionIds.length === 1 ? "" : "s"}`;
  elements.sessionChip.textContent = "In Progress";
  elements.sessionChip.className = "session-chip active";
  elements.quizWorkspace.classList.remove("hidden");
  elements.completionCard.classList.add("hidden");
  renderQuestion(currentQuestion);
  renderFeedback(currentQuestion);
  queueMathTypeset(getVisibleMathContainers());
}

function renderQuestion(question) {
  if (!question || !state.session || !state.session.currentCard) {
    return;
  }

  const reviewState = state.session.reviewStates.get(question.id);
  const answerState = state.session.answerState;

  if (answerState && answerState.badgeText) {
    elements.questionBadge.textContent = answerState.badgeText;
  } else if (reviewState) {
    elements.questionBadge.textContent = `Recovery streak ${reviewState.streak}/3`;
  } else {
    elements.questionBadge.textContent = "Fresh question";
  }

  elements.questionOrder.textContent = `Exposure ${state.session.exposureCount}`;
  elements.questionPrompt.textContent = question.prompt;
  elements.questionCitation.textContent = `${question.citation.sourceFile} • page ${question.citation.page}`;
  renderQuestionTags(question.tags);
  renderChoices(state.session.currentCard.options, question, answerState);
}

function renderQuestionTags(tags) {
  elements.questionTags.textContent = "";
  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "question-tag";
    chip.textContent = tag;
    elements.questionTags.appendChild(chip);
  });
}

function renderChoices(options, question, answerState) {
  elements.choiceList.textContent = "";

  options.forEach((option, displayIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.disabled = Boolean(answerState);

    if (answerState) {
      const isSelected = answerState.displayIndex === displayIndex;
      const isCorrect = option.originalIndex === question.correctChoice;

      if (isCorrect) {
        button.classList.add("correct");
      }

      if (isSelected && !answerState.isCorrect) {
        button.classList.add("incorrect");
      }
    }

    const indexBubble = document.createElement("span");
    indexBubble.className = "choice-index";
    indexBubble.textContent = displayIndex + 1;

    const answerText = document.createElement("span");
    answerText.className = "choice-text";
    answerText.textContent = option.text;

    button.append(indexBubble, answerText);
    button.addEventListener("click", () => submitAnswer(displayIndex));
    elements.choiceList.appendChild(button);
  });
}

function renderFeedback(question) {
  if (!state.session || !state.session.answerState || !question) {
    elements.feedbackCard.classList.add("hidden");
    return;
  }

  const answerState = state.session.answerState;
  const correctAnswer = question.choices[question.correctChoice];
  const reviewSkipped = Boolean(answerState.reviewSkipped);
  elements.feedbackCard.classList.remove("hidden");
  elements.feedbackCard.classList.toggle("correct", answerState.isCorrect || reviewSkipped);
  elements.feedbackCard.classList.toggle("incorrect", !answerState.isCorrect && !reviewSkipped);
  elements.feedbackIcon.textContent = answerState.isCorrect || reviewSkipped ? "OK" : "!";
  elements.feedbackTitle.textContent = answerState.isCorrect
    ? "Correct"
    : reviewSkipped
      ? "Review skipped"
      : "Review this one";
  elements.feedbackAnswer.textContent = correctAnswer;
  elements.feedbackExplanation.textContent = question.explanation;
  elements.feedbackReview.textContent = answerState.reviewMessage;
  elements.skipReview.classList.toggle("hidden", answerState.isCorrect || reviewSkipped);
}

function renderCompletion() {
  const session = state.session;
  if (!session) {
    return;
  }

  elements.completionCard.classList.remove("hidden");
  elements.completionMastered.textContent = `${session.mastered.size}`;
  elements.completionReviewNeeded.textContent = `${session.questionsNeedingReview.size}`;
  elements.completionAttempts.textContent = `${session.correctAttempts + session.wrongAttempts}`;
}

function toggleTag(tag) {
  if (state.selectedTags.has(tag)) {
    state.selectedTags.delete(tag);
  } else {
    state.selectedTags.add(tag);
  }

  resetSessionForTagChange();
  render();
}

function selectAllTags() {
  if (!state.bank) {
    return;
  }

  state.selectedTags = new Set(state.bank.tags);
  resetSessionForTagChange();
  render();
}

function clearAllTags() {
  state.selectedTags = new Set();
  resetSessionForTagChange();
  render();
}

function handleTagSearch(event) {
  state.tagSearch = event.target.value;
  renderTags();
}

function getSelectedQuestions() {
  if (!state.bank || state.selectedTags.size === 0) {
    return [];
  }

  return state.bank.questions.filter((question) =>
    question.tags.some((tag) => state.selectedTags.has(tag)),
  );
}

function resetSessionForTagChange() {
  if (!state.session) {
    return;
  }

  state.session = null;
  state.bankStatus = {
    tone: "muted",
    message: "Study tags changed. Start a new quiz session to use the updated filter.",
  };
}

function startSession() {
  const selectedQuestions = getSelectedQuestions();
  if (selectedQuestions.length === 0) {
    state.bankStatus = {
      tone: "error",
      message: "Choose at least one tag with matching questions before starting a session.",
    };
    render();
    return;
  }

  state.session = {
    selectedQuestionIds: selectedQuestions.map((question) => question.id),
    baseQueue: shuffle(selectedQuestions.map((question) => question.id)),
    reviewStates: new Map(),
    mastered: new Set(),
    questionsNeedingReview: new Set(),
    correctAttempts: 0,
    wrongAttempts: 0,
    exposureCount: 0,
    reviewTicket: 0,
    currentQuestionId: null,
    currentCard: null,
    answerState: null,
    completed: false,
  };

  selectNextQuestion();
  render();
}

function advanceSession() {
  if (!state.session || !state.session.answerState) {
    return;
  }

  advanceReviewCooldowns(state.session.currentQuestionId);
  selectNextQuestion();
  render();
}

function submitAnswer(displayIndex) {
  const session = state.session;
  const question = getCurrentQuestion();

  if (!session || !question || session.answerState) {
    return;
  }

  const option = session.currentCard.options[displayIndex];
  const isCorrect = option.originalIndex === question.correctChoice;
  const existingReview = session.reviewStates.get(question.id);
  let reviewMessage = "";
  let badgeText = "";

  if (isCorrect) {
    session.correctAttempts += 1;

    if (existingReview) {
      existingReview.streak += 1;
      if (existingReview.streak >= 3) {
        session.reviewStates.delete(question.id);
        session.mastered.add(question.id);
        reviewMessage = "Mastered";
        badgeText = "Recovery complete";
      } else {
        existingReview.cooldown = 3;
        existingReview.ticket = ++session.reviewTicket;
        reviewMessage = `Progress ${existingReview.streak}/3`;
        badgeText = `Recovery streak ${existingReview.streak}/3`;
      }
    } else {
      session.mastered.add(question.id);
      reviewMessage = "Mastered";
      badgeText = "Fresh question";
    }
  } else {
    session.wrongAttempts += 1;
    session.questionsNeedingReview.add(question.id);
    session.mastered.delete(question.id);
    session.reviewStates.set(question.id, {
      streak: 0,
      cooldown: 3,
      ticket: ++session.reviewTicket,
    });
    reviewMessage = "Needs review";
    badgeText = "Recovery streak 0/3";
  }

  session.answerState = {
    displayIndex,
    isCorrect,
    badgeText,
    reviewMessage,
    reviewSkipped: false,
  };

  render();
}

function skipReviewForCurrentQuestion() {
  const session = state.session;
  const question = getCurrentQuestion();

  if (!session || !question || !session.answerState || session.answerState.isCorrect) {
    return;
  }

  session.reviewStates.delete(question.id);
  session.questionsNeedingReview.delete(question.id);
  session.mastered.add(question.id);
  session.wrongAttempts = Math.max(0, session.wrongAttempts - 1);

  advanceSession();
}

function selectNextQuestion() {
  const session = state.session;
  if (!session) {
    return;
  }

  const nextId = pickNextQuestion(session);
  if (!nextId) {
    session.completed = true;
    session.currentQuestionId = null;
    session.currentCard = null;
    session.answerState = null;
    return;
  }

  session.completed = false;
  session.currentQuestionId = nextId;
  session.currentCard = buildCard(getQuestionById(nextId));
  session.answerState = null;
  session.exposureCount += 1;
}

function pickNextQuestion(session) {
  const dueReviewIds = [...session.reviewStates.entries()]
    .filter(([, reviewState]) => reviewState.cooldown <= 0)
    .sort((left, right) => left[1].ticket - right[1].ticket)
    .map(([id]) => id);

  if (dueReviewIds.length > 0) {
    return dueReviewIds[0];
  }

  while (session.baseQueue.length > 0) {
    const candidate = session.baseQueue.shift();
    if (!session.mastered.has(candidate)) {
      return candidate;
    }
  }

  if (session.reviewStates.size === 0) {
    return null;
  }

  const nextReview = [...session.reviewStates.entries()].sort((left, right) => {
    if (left[1].cooldown === right[1].cooldown) {
      return left[1].ticket - right[1].ticket;
    }

    return left[1].cooldown - right[1].cooldown;
  })[0];

  if (!nextReview) {
    return null;
  }

  nextReview[1].cooldown = 0;
  return nextReview[0];
}

function advanceReviewCooldowns(excludedQuestionId) {
  const session = state.session;
  if (!session) {
    return;
  }

  session.reviewStates.forEach((reviewState, questionId) => {
    if (questionId === excludedQuestionId) {
      return;
    }

    reviewState.cooldown = Math.max(0, reviewState.cooldown - 1);
  });
}

function buildCard(question) {
  return {
    options: shuffle(
      question.choices.map((choice, originalIndex) => ({
        text: choice,
        originalIndex,
      })),
    ),
  };
}

function getCurrentQuestion() {
  if (!state.session || !state.session.currentQuestionId) {
    return null;
  }

  return getQuestionById(state.session.currentQuestionId);
}

function getQuestionById(questionId) {
  if (!state.bank) {
    return null;
  }

  return state.bank.questionMap.get(questionId) || null;
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function getVisibleMathContainers() {
  const nodes = [elements.questionPrompt, elements.choiceList];

  if (!elements.feedbackCard.classList.contains("hidden")) {
    nodes.push(elements.feedbackAnswer, elements.feedbackExplanation);
  }

  return nodes.filter(Boolean);
}

function queueMathTypeset(containers) {
  const nodes = containers.filter(Boolean);
  if (
    !window.MathJax
    || typeof window.MathJax.typesetPromise !== "function"
    || typeof window.MathJax.typesetClear !== "function"
    || !window.MathJax.startup
  ) {
    return Promise.resolve();
  }

  mathTypesetPromise = mathTypesetPromise
    .catch(() => undefined)
    .then(() => window.MathJax.startup.promise)
    .then(() => {
      window.MathJax.typesetClear();
      if (nodes.length === 0) {
        return undefined;
      }

      return window.MathJax.typesetPromise(nodes);
    })
    .catch((error) => {
      console.error("MathJax typesetting failed.", error);
    });

  return mathTypesetPromise;
}

function validateQuestionBank(rawValue) {
  if (!isPlainObject(rawValue)) {
    throw new Error("The question bank root must be a YAML object.");
  }

  if (!Array.isArray(rawValue.questions) || rawValue.questions.length === 0) {
    throw new Error("The question bank must include a non-empty questions list.");
  }

  const seenIds = new Set();
  const questions = rawValue.questions.map((rawQuestion, index) => {
    if (!isPlainObject(rawQuestion)) {
      throw new Error(`Question ${index + 1} must be an object.`);
    }

    const id = requireString(rawQuestion.id, `Question ${index + 1} is missing id.`);
    if (seenIds.has(id)) {
      throw new Error(`Duplicate question id found: ${id}`);
    }

    seenIds.add(id);

    const prompt = requireString(
      rawQuestion.prompt,
      `Question ${id} is missing prompt.`,
    );
    const explanation = requireString(
      rawQuestion.explanation,
      `Question ${id} is missing explanation.`,
    );

    if (!Array.isArray(rawQuestion.choices) || rawQuestion.choices.length !== 4) {
      throw new Error(`Question ${id} must have exactly 4 choices.`);
    }

    const choices = rawQuestion.choices.map((choice, choiceIndex) =>
      requireString(choice, `Question ${id} has an invalid choice at position ${choiceIndex + 1}.`),
    );

    const correctChoice = requireInteger(
      rawQuestion.correct_choice,
      `Question ${id} must include a numeric correct_choice.`,
    );

    if (correctChoice < 0 || correctChoice >= choices.length) {
      throw new Error(`Question ${id} has a correct_choice outside the valid range.`);
    }

    if (!isPlainObject(rawQuestion.citation)) {
      throw new Error(`Question ${id} must include a citation object.`);
    }

    const sourceFile = requireString(
      rawQuestion.citation.source_file,
      `Question ${id} is missing citation.source_file.`,
    );
    const page = requireInteger(
      rawQuestion.citation.page,
      `Question ${id} is missing citation.page.`,
    );

    if (!Array.isArray(rawQuestion.tags) || rawQuestion.tags.length === 0) {
      throw new Error(`Question ${id} must include at least one tag.`);
    }

    const tags = rawQuestion.tags.map((tag, tagIndex) =>
      requireString(tag, `Question ${id} has an invalid tag at position ${tagIndex + 1}.`),
    );

    return {
      id,
      prompt,
      choices,
      correctChoice,
      explanation,
      citation: {
        sourceFile,
        page,
      },
      tags,
    };
  });

  const tagCounts = new Map();
  questions.forEach((question) => {
    question.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const tags = [...tagCounts.keys()].sort((left, right) => {
    const countDifference = tagCounts.get(right) - tagCounts.get(left);
    if (countDifference !== 0) {
      return countDifference;
    }

    return left.localeCompare(right);
  });

  return {
    questions,
    tags,
    tagCounts,
    questionMap: new Map(questions.map((question) => [question.id, question])),
  };
}

function requireString(value, message) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }

  return value.trim();
}

function requireInteger(value, message) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value, 10);
  }

  throw new Error(message);
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseYaml(sourceText) {
  const lines = preprocessYaml(sourceText);
  if (lines.length === 0) {
    throw new Error("The YAML file is empty.");
  }

  if (lines[0].indent !== 0) {
    throw new Error(`The YAML root must start at column 1 (line ${lines[0].number}).`);
  }

  const [value, nextIndex] = parseNode(lines, 0, 0);
  if (nextIndex !== lines.length) {
    const nextLine = lines[nextIndex];
    throw new Error(`Unexpected content at line ${nextLine.number}.`);
  }

  return value;
}

function preprocessYaml(sourceText) {
  const normalized = sourceText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rawLines = normalized.split("\n");
  const lines = [];

  rawLines.forEach((rawLine, index) => {
    if (/\t/.test(rawLine)) {
      throw new Error(`Tabs are not supported in YAML indentation (line ${index + 1}).`);
    }

    const withoutComment = stripYamlComment(rawLine);
    if (!withoutComment.trim()) {
      return;
    }

    const indentMatch = withoutComment.match(/^ */);
    const indent = indentMatch ? indentMatch[0].length : 0;
    if (indent % 2 !== 0) {
      throw new Error(`Use indentation in multiples of 2 spaces (line ${index + 1}).`);
    }

    lines.push({
      number: index + 1,
      indent,
      content: withoutComment.slice(indent).trimEnd(),
    });
  });

  return lines;
}

function stripYamlComment(line) {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (inDoubleQuote && character === "\\" && !escaped) {
      escaped = true;
      continue;
    }

    if (!inDoubleQuote && character === "'" && !escaped) {
      inSingleQuote = !inSingleQuote;
    } else if (!inSingleQuote && character === '"' && !escaped) {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote && character === "#") {
      if (index === 0 || /\s/.test(line[index - 1])) {
        return line.slice(0, index).trimEnd();
      }
    }

    escaped = false;
  }

  return line.trimEnd();
}

function parseNode(lines, startIndex, expectedIndent) {
  if (startIndex >= lines.length) {
    throw new Error("Unexpected end of YAML input.");
  }

  const line = lines[startIndex];
  if (line.indent !== expectedIndent) {
    throw new Error(`Unexpected indentation at line ${line.number}.`);
  }

  if (line.content.startsWith("- ")) {
    return parseSequence(lines, startIndex, expectedIndent);
  }

  return parseMapping(lines, startIndex, expectedIndent);
}

function parseMapping(lines, startIndex, expectedIndent) {
  const output = {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];

    if (line.indent < expectedIndent) {
      break;
    }

    if (line.indent > expectedIndent) {
      throw new Error(`Unexpected indentation at line ${line.number}.`);
    }

    if (line.content.startsWith("- ")) {
      break;
    }

    const pair = splitKeyValue(line.content, line.number);
    if (!pair) {
      throw new Error(`Invalid mapping entry at line ${line.number}.`);
    }

    if (Object.prototype.hasOwnProperty.call(output, pair.key)) {
      throw new Error(`Duplicate key "${pair.key}" at line ${line.number}.`);
    }

    index += 1;

    if (pair.value === "") {
      if (index < lines.length && lines[index].indent > expectedIndent) {
        const [childValue, nextIndex] = parseNode(lines, index, lines[index].indent);
        output[pair.key] = childValue;
        index = nextIndex;
      } else {
        output[pair.key] = "";
      }
    } else {
      output[pair.key] = parseScalar(pair.value, line.number);
    }
  }

  return [output, index];
}

function parseSequence(lines, startIndex, expectedIndent) {
  const output = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];

    if (line.indent < expectedIndent) {
      break;
    }

    if (line.indent > expectedIndent) {
      throw new Error(`Unexpected indentation at line ${line.number}.`);
    }

    if (!line.content.startsWith("- ")) {
      break;
    }

    const itemContent = line.content.slice(2).trimStart();
    index += 1;

    if (itemContent === "") {
      if (index < lines.length && lines[index].indent > expectedIndent) {
        const [childValue, nextIndex] = parseNode(lines, index, lines[index].indent);
        output.push(childValue);
        index = nextIndex;
      } else {
        output.push("");
      }
      continue;
    }

    if (looksLikeInlineMappingItem(itemContent)) {
      const [itemValue, nextIndex] = parseInlineMappingSequenceItem(
        lines,
        index,
        expectedIndent,
        itemContent,
        line.number,
      );
      output.push(itemValue);
      index = nextIndex;
      continue;
    }

    output.push(parseScalar(itemContent, line.number));
  }

  return [output, index];
}

function parseInlineMappingSequenceItem(lines, startIndex, expectedIndent, itemContent, lineNumber) {
  const pair = splitKeyValue(itemContent, lineNumber);
  if (!pair) {
    throw new Error(`Invalid list item at line ${lineNumber}.`);
  }

  const item = {};
  let index = startIndex;

  if (pair.value === "") {
    if (index < lines.length && lines[index].indent > expectedIndent) {
      const [childValue, nextIndex] = parseNode(lines, index, lines[index].indent);
      item[pair.key] = childValue;
      index = nextIndex;
    } else {
      item[pair.key] = "";
    }
  } else {
    item[pair.key] = parseScalar(pair.value, lineNumber);
  }

  if (index < lines.length && lines[index].indent > expectedIndent) {
    const [restOfItem, nextIndex] = parseMapping(lines, index, lines[index].indent);
    Object.assign(item, restOfItem);
    index = nextIndex;
  }

  return [item, index];
}

function looksLikeInlineMappingItem(itemContent) {
  const pair = splitKeyValue(itemContent);
  if (!pair) {
    return false;
  }

  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(pair.key);
}

function splitKeyValue(content, lineNumber = 0) {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (inDoubleQuote && character === "\\" && !escaped) {
      escaped = true;
      continue;
    }

    if (!inDoubleQuote && character === "'" && !escaped) {
      inSingleQuote = !inSingleQuote;
    } else if (!inSingleQuote && character === '"' && !escaped) {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote && character === ":") {
      const key = content.slice(0, index).trim();
      const value = content.slice(index + 1).trim();
      if (!key) {
        if (lineNumber) {
          throw new Error(`Missing key at line ${lineNumber}.`);
        }
        return null;
      }

      return { key, value };
    }

    escaped = false;
  }

  return null;
}

function parseScalar(value, lineNumber) {
  if (/^\[.*\]$/.test(value)) {
    return parseInlineList(value, lineNumber);
  }

  if (/^".*"$/.test(value)) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`Invalid double-quoted string at line ${lineNumber}.`);
    }
  }

  if (/^'.*'$/.test(value)) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  if (/^(true|false)$/i.test(value)) {
    return value.toLowerCase() === "true";
  }

  if (/^(null|~)$/i.test(value)) {
    return null;
  }

  return value;
}

function parseInlineList(value, lineNumber) {
  const items = [];
  const inner = value.slice(1, -1).trim();

  if (!inner) {
    return items;
  }

  let buffer = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let index = 0; index < inner.length; index += 1) {
    const character = inner[index];

    if (inDoubleQuote && character === "\\" && !escaped) {
      escaped = true;
      buffer += character;
      continue;
    }

    if (!inDoubleQuote && character === "'" && !escaped) {
      inSingleQuote = !inSingleQuote;
    } else if (!inSingleQuote && character === '"' && !escaped) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (!inSingleQuote && !inDoubleQuote && character === ",") {
      items.push(parseScalar(buffer.trim(), lineNumber));
      buffer = "";
      escaped = false;
      continue;
    }

    buffer += character;
    escaped = false;
  }

  if (buffer.trim()) {
    items.push(parseScalar(buffer.trim(), lineNumber));
  }

  return items;
}
