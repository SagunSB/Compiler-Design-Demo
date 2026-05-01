const phaseList = document.querySelector("#phaseList");
const phaseTitle = document.querySelector("#phaseTitle");
const visualHeading = document.querySelector("#visualHeading");
const phaseBadge = document.querySelector("#phaseBadge");
const phaseVisual = document.querySelector("#phaseVisual");
const phaseNarration = document.querySelector("#phaseNarration");
const phaseResult = document.querySelector("#phaseResult");
const sourceCode = document.querySelector("#sourceCode");
const programOutput = document.querySelector("#programOutput");
const progressBar = document.querySelector("#progressBar");
const valueA = document.querySelector("#valueA");
const valueB = document.querySelector("#valueB");
const prevPhase = document.querySelector("#prevPhase");
const nextPhase = document.querySelector("#nextPhase");
const resetValues = document.querySelector("#resetValues");
const runPhase = document.querySelector("#runPhase");
const runAll = document.querySelector("#runAll");
const clearConsole = document.querySelector("#clearConsole");
const compilerConsole = document.querySelector("#compilerConsole");

let currentPhase = 0;
let isRunning = false;
let runningItem = -1;
let completedItem = -1;
let completedPhases = new Set();
let consoleLines = [];

const phaseNames = [
  ["Lexical Analysis", "Breaks code into tokens"],
  ["Syntax Analysis", "Builds parse tree / AST"],
  ["Semantic Analysis", "Checks meaning and types"],
  ["Intermediate Code", "Creates three-address code"],
  ["Optimization", "Removes extra work"],
  ["Code Generation", "Produces target instructions"]
];

function getValues() {
  return {
    a: Number(valueA.value || 0),
    b: Number(valueB.value || 0)
  };
}

function getOutput(a, b) {
  if (a > 0) {
    return b > 0 ? "Both are positive" : "a positive, b negative";
  }
  return "a is negative";
}

function getSource(a, b) {
  return `#include <stdio.h>
int main()
{
    int a = ${a}, b = ${b};
    if(a > 0)
    {
        if(b > 0)
            printf("Both are positive");
        else
            printf("a positive, b negative");
    }
    else
    {
        printf("a is negative");
    }
    return 0;
}`;
}

function getSourceLines(a, b) {
  return getSource(a, b).split("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function token(type, value) {
  return `<div class="token" data-run-item><b>${escapeHtml(value)}</b><span>${type}</span></div>`;
}

function renderTokens(a, b) {
  const tokens = [
    ["Preprocessor", "#include"],
    ["Header file", "<stdio.h>"],
    ["Keyword", "int"],
    ["Identifier", "main"],
    ["Punctuation", "() { }"],
    ["Keyword", "int"],
    ["Identifier", "a"],
    ["Operator", "="],
    ["Constant", a],
    ["Identifier", "b"],
    ["Constant", b],
    ["Keyword", "if"],
    ["Relational operator", ">"],
    ["Function", "printf"],
    ["String literal", '"Both are positive"'],
    ["Keyword", "else"],
    ["Keyword", "return"]
  ];

  return `<div class="token-grid">${tokens.map(([type, value]) => token(type, value)).join("")}</div>`;
}

function renderSyntaxTree(a, b) {
  return `
    <div class="tree">
      <div class="tree-node root" data-run-item><strong>Program</strong> &rarr; include + main function</div>
      <div class="tree-row">
        <div class="tree-node" data-run-item><strong>Declaration</strong><br>int a = ${a}, b = ${b}</div>
        <div class="tree-node" data-run-item><strong>Outer if</strong><br>condition: a &gt; 0</div>
      </div>
      <div class="tree-row">
        <div class="tree-node" data-run-item><strong>Inner if</strong><br>condition: b &gt; 0</div>
        <div class="tree-node" data-run-item><strong>Outer else</strong><br>printf("a is negative")</div>
      </div>
      <div class="tree-row">
        <div class="tree-node" data-run-item><strong>True branch</strong><br>printf("Both are positive")</div>
        <div class="tree-node" data-run-item><strong>False branch</strong><br>printf("a positive, b negative")</div>
      </div>
    </div>`;
}

function renderSemantic(a, b) {
  const checks = [
    ["a", "int", a, "Declared before use"],
    ["b", "int", b, "Declared before use"],
    ["printf", "library function", "stdio.h", "Header available"],
    ["a > 0", "boolean expression", a > 0, "Valid comparison"],
    ["b > 0", "boolean expression", b > 0, "Valid comparison"]
  ];

  return `
    <table class="symbol-table">
      <thead><tr><th>Name / Expression</th><th>Type</th><th>Current Value</th><th>Semantic Check</th></tr></thead>
      <tbody>
        ${checks.map((row) => `<tr data-run-item>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>`;
}

function renderIntermediate(a, b) {
  const lines = [
    `a = ${a}`,
    `b = ${b}`,
    "if a > 0 goto L1",
    "goto L4",
    "L1: if b > 0 goto L2",
    "goto L3",
    'L2: print "Both are positive"',
    "goto L5",
    'L3: print "a positive, b negative"',
    "goto L5",
    'L4: print "a is negative"',
    "L5: return 0"
  ];

  return `<div class="ir-stack">${lines.map((line) => `<div class="ir-line" data-run-item>${escapeHtml(line)}</div>`).join("")}</div>`;
}

function renderOptimization(a, b) {
  const knownPath = a > 0 ? (b > 0 ? "L2" : "L3") : "L4";
  const output = getOutput(a, b);

  return `
    <div class="optimization-grid">
      <div class="mini-panel">
        <h3>Before optimization</h3>
        <ul>
          <li data-run-item>Both conditions are checked during execution.</li>
          <li data-run-item>All three print branches remain in intermediate code.</li>
          <li data-run-item>Extra jumps are used to skip other branches.</li>
        </ul>
      </div>
      <div class="mini-panel">
        <h3>After optimization</h3>
        <ul>
          <li data-run-item>Constant values tell the compiler this run goes to ${knownPath}.</li>
          <li data-run-item>Unreachable branches can be removed for this fixed input.</li>
          <li data-run-item>Final simplified action: print "${escapeHtml(output)}".</li>
        </ul>
      </div>
    </div>`;
}

function renderCodeGeneration(a, b) {
  const output = getOutput(a, b);
  const lines = [
    `MOV R1, #${a}`,
    `MOV R2, #${b}`,
    "CMP R1, #0",
    a > 0 ? "JG CHECK_B" : "JLE PRINT_A_NEGATIVE",
    "CHECK_B:",
    "CMP R2, #0",
    b > 0 ? "JG PRINT_BOTH_POSITIVE" : "JLE PRINT_A_POS_B_NEG",
    `CALL printf ; "${output}"`,
    "MOV R0, #0",
    "RET"
  ];

  return `<div class="assembly">${lines.map((line) => `<div class="asm-line" data-run-item>${escapeHtml(line)}</div>`).join("")}</div>`;
}

function renderFlow(a, b) {
  const output = getOutput(a, b);
  const steps = [
    ["Load variables", `a = ${a}, b = ${b}`, "green"],
    ["Test outer condition", `a > 0 is ${a > 0}`, a > 0 ? "green" : "red"],
    ["Test inner condition", a > 0 ? `b > 0 is ${b > 0}` : "skipped", a > 0 && b > 0 ? "green" : "red"],
    ["Print selected message", output, "green"]
  ];

  return `<div class="flow">${steps.map(([title, detail, color]) => `
    <div class="flow-step" data-run-item>
      <span class="dot ${color}"></span>
      <div><strong>${escapeHtml(title)}</strong><br><span>${escapeHtml(detail)}</span></div>
    </div>`).join("")}</div>`;
}

const phases = [
  {
    heading: "Tokens Created",
    narration: "Explain that lexical analysis reads the source code character by character and groups it into meaningful tokens such as keywords, identifiers, constants, operators, and string literals.",
    result: "The compiler now has a clean token stream and no longer needs to look at raw characters.",
    render: renderTokens
  },
  {
    heading: "Parse Tree / AST",
    narration: "Explain that syntax analysis checks grammar: declarations must be valid, braces must match, if must have a condition, and else must attach to the nearest unmatched if.",
    result: "The nested if-else structure is valid, so the compiler builds a tree representation of the program.",
    render: renderSyntaxTree
  },
  {
    heading: "Meaning and Type Checks",
    narration: "Explain that semantic analysis verifies whether variables are declared, whether comparisons use compatible types, and whether printf is available through stdio.h.",
    result: "The code passes semantic checks because a and b are integers, the comparisons are valid, and printf is declared.",
    render: renderSemantic
  },
  {
    heading: "Three-Address Code",
    narration: "Explain that intermediate code is a machine-independent form. Labels and jumps show exactly how the nested decision flow will execute.",
    result: "The compiler converts the source into three-address code with labels L1 to L5.",
    render: renderIntermediate
  },
  {
    heading: "Optimized Version",
    narration: "Explain that optimization improves the intermediate code. Because this demo uses fixed values, the compiler can predict the branch and remove unreachable work.",
    result: "The program can be simplified to the selected print statement for the current values.",
    render: renderOptimization
  },
  {
    heading: "Target Code",
    narration: "Explain that code generation maps the optimized logic into low-level instructions such as MOV, CMP, jumps, CALL, and RET.",
    result: "The generated target-style code produces the same final output as the original C program.",
    render: renderCodeGeneration
  }
];

const phaseLogs = [
  ["Scanning source characters", "Classifying keywords, identifiers, constants, operators", "Token stream ready"],
  ["Reading tokens using C grammar", "Matching declaration and nested if-else rules", "AST created successfully"],
  ["Building symbol table", "Checking int comparisons and printf declaration", "Semantic checks passed"],
  ["Creating labels for branches", "Converting if-else blocks to jumps", "Three-address code generated"],
  ["Finding constant branch path", "Removing unreachable branch work", "Optimized code ready"],
  ["Mapping instructions to registers", "Generating comparisons, jumps, and printf call", "Target code complete"]
];

const phaseFocusLines = [
  [0, 1, 3, 4, 6, 7, 9, 13],
  [1, 2, 3, 4, 5, 6, 8, 10, 13],
  [0, 3, 4, 6, 7, 9, 13],
  [3, 4, 6, 8, 10, 13],
  [3, 4, 6, 8, 10],
  [3, 4, 6, 8, 10, 13]
];

function addConsoleLine(label, message) {
  consoleLines.push({ label, message });
  if (consoleLines.length > 18) {
    consoleLines = consoleLines.slice(-18);
  }
  renderConsole();
}

function renderConsole() {
  if (consoleLines.length === 0) {
    compilerConsole.innerHTML = `<div class="console-empty">Press Run Phase or Run All to start the compiler simulation.</div>`;
    return;
  }

  compilerConsole.innerHTML = consoleLines.map((line) => `
    <div class="console-line"><span>${escapeHtml(line.label)}</span><span>${escapeHtml(line.message)}</span></div>
  `).join("");
  compilerConsole.scrollTop = compilerConsole.scrollHeight;
}

function renderSourceWithHighlights(a, b) {
  const focusLines = new Set(phaseFocusLines[currentPhase] || []);
  return getSourceLines(a, b).map((line, index) => {
    const focusClass = focusLines.has(index) ? " focus" : "";
    return `<span class="code-line${focusClass}">${escapeHtml(line) || " "}</span>`;
  }).join("");
}

function decorateRunItems() {
  const items = phaseVisual.querySelectorAll("[data-run-item]");
  items.forEach((item, index) => {
    item.classList.toggle("running", index === runningItem);
    item.classList.toggle("done", index <= completedItem);
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runSelectedPhase() {
  if (isRunning) return;
  isRunning = true;
  runPhase.disabled = true;
  runAll.disabled = true;
  addConsoleLine(`phase ${currentPhase + 1}`, `Running ${phaseNames[currentPhase][0]}...`);

  const itemCount = phaseVisual.querySelectorAll("[data-run-item]").length;
  const maxItems = Math.max(1, Math.min(itemCount, 8));
  completedItem = -1;

  for (let index = 0; index < maxItems; index += 1) {
    runningItem = index;
    completedItem = index - 1;
    decorateRunItems();
    if (phaseLogs[currentPhase][index % phaseLogs[currentPhase].length]) {
      addConsoleLine("step", phaseLogs[currentPhase][index % phaseLogs[currentPhase].length]);
    }
    await sleep(360);
  }

  runningItem = -1;
  completedItem = itemCount;
  completedPhases.add(currentPhase);
  decorateRunItems();
  addConsoleLine("done", `${phaseNames[currentPhase][0]} completed.`);
  isRunning = false;
  runPhase.disabled = false;
  runAll.disabled = false;
  renderPhaseList();
}

async function runEveryPhase() {
  if (isRunning) return;
  addConsoleLine("compile", "Starting full 6-phase compilation...");
  for (let index = 0; index < phases.length; index += 1) {
    currentPhase = index;
    runningItem = -1;
    completedItem = -1;
    render();
    await sleep(160);
    await runSelectedPhase();
  }
  const { a, b } = getValues();
  addConsoleLine("output", getOutput(a, b));
}

function renderPhaseList() {
  phaseList.innerHTML = phaseNames.map(([name, detail], index) => `
    <button class="phase-button ${index === currentPhase ? "active" : ""} ${completedPhases.has(index) ? "done" : ""}" type="button" data-index="${index}">
      <span>${index + 1}</span>
      <span><strong>${name}</strong><small>${detail}</small></span>
    </button>
  `).join("");

  phaseList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      currentPhase = Number(button.dataset.index);
      runningItem = -1;
      completedItem = completedPhases.has(currentPhase) ? Number.MAX_SAFE_INTEGER : -1;
      render();
    });
  });
}

function render() {
  const { a, b } = getValues();
  const phase = phases[currentPhase];
  sourceCode.innerHTML = renderSourceWithHighlights(a, b);
  programOutput.textContent = getOutput(a, b);
  phaseTitle.textContent = phaseNames[currentPhase][0];
  visualHeading.textContent = phase.heading;
  phaseBadge.textContent = `Phase ${currentPhase + 1} of 6`;
  phaseVisual.innerHTML = phase.render(a, b) + (currentPhase === 5 ? renderFlow(a, b) : "");
  decorateRunItems();
  phaseNarration.textContent = phase.narration;
  phaseResult.textContent = phase.result;
  progressBar.style.width = `${((currentPhase + 1) / phases.length) * 100}%`;
  prevPhase.disabled = currentPhase === 0;
  nextPhase.disabled = currentPhase === phases.length - 1;
  renderPhaseList();
  renderConsole();
}

valueA.addEventListener("input", () => {
  completedPhases = new Set();
  runningItem = -1;
  completedItem = -1;
  render();
});
valueB.addEventListener("input", () => {
  completedPhases = new Set();
  runningItem = -1;
  completedItem = -1;
  render();
});
prevPhase.addEventListener("click", () => {
  currentPhase = Math.max(0, currentPhase - 1);
  runningItem = -1;
  completedItem = completedPhases.has(currentPhase) ? Number.MAX_SAFE_INTEGER : -1;
  render();
});
nextPhase.addEventListener("click", () => {
  currentPhase = Math.min(phases.length - 1, currentPhase + 1);
  runningItem = -1;
  completedItem = completedPhases.has(currentPhase) ? Number.MAX_SAFE_INTEGER : -1;
  render();
});
resetValues.addEventListener("click", () => {
  valueA.value = 10;
  valueB.value = 20;
  currentPhase = 0;
  runningItem = -1;
  completedItem = -1;
  completedPhases = new Set();
  consoleLines = [];
  render();
});
runPhase.addEventListener("click", runSelectedPhase);
runAll.addEventListener("click", runEveryPhase);
clearConsole.addEventListener("click", () => {
  consoleLines = [];
  renderConsole();
});

render();
