import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SERVICE_PATH = "src/services/reservation.service.ts";
const LOG_PATH = process.env.TEST_LOG ?? "test-results.log";

const AGENT_PROMPT =
  "Parse the attached Jest failure log. Locate the source code causing the failure in src/ and generate a patch that fixes the bug without breaking existing tests. " +
  "Return only the full corrected contents of src/services/reservation.service.ts between the markers ---FILE--- and ---END---. Do not change tests.";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

function readLog(): string {
  return readFileSync(LOG_PATH, "utf8");
}

function overlapHelper(source: string): string {
  const match = source.match(/async function hasActiveOverlap[\s\S]*?\n\}/);
  if (match === null) {
    throw new Error("hasActiveOverlap was not found in the reservation service");
  }
  return match[0];
}

function logShowsOverlapFailure(log: string): boolean {
  const missedConflict =
    log.includes("Expected: 409") || log.includes("Expected AppError 409");
  const falseConflict = log.includes("Received: 409") || log.includes("DOUBLE_BOOKING");
  return missedConflict || falseConflict;
}

function repairOverlap(source: string, log: string): string {
  if (!logShowsOverlapFailure(log)) {
    throw new Error("Jest log does not describe a reservation conflict failure");
  }

  const current = overlapHelper(source);
  const invertedOperators =
    current.includes("$or") ||
    current.includes("$gte") ||
    current.includes("$lte") ||
    current.includes("$gt: end") ||
    current.includes("$lt: start");
  const invertedFlag = current.includes("=== null");
  if (!invertedOperators && !invertedFlag) {
    throw new Error("Overlap helper does not match the failure");
  }

  let next = current;
  if (current.includes("$or")) {
    next = next.replace(
      /\$or:\s*\[[\s\S]*?\],\n/,
      "startTime: { $lt: end },\n      endTime: { $gt: start },\n",
    );
  }
  next = next.replace(/startTime:\s*\{[^}]*\}/, "startTime: { $lt: end }");
  next = next.replace(/endTime:\s*\{[^}]*\}/, "endTime: { $gt: start }");
  if (invertedFlag && (log.includes("Expected: 409") || log.includes("Expected AppError 409"))) {
    next = next.replace("=== null", "!== null");
  }
  return source.replace(current, next);
}

function extractFile(answer: string): string | undefined {
  const match = answer.match(/---FILE---\s*([\s\S]*?)\s*---END---/);
  if (match === null) {
    return undefined;
  }
  const file = match[1];
  if (!file.includes("function hasActiveOverlap") || !file.includes("function createReservation")) {
    return undefined;
  }
  return file;
}

async function completeChat(url: string, headers: Record<string, string>, body: unknown): Promise<string | undefined> {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.log(`Model request failed: ${response.status} ${url}`);
    return undefined;
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    content?: Array<{ text?: string }>;
  };
  const fromOpenAI = payload.choices?.[0]?.message?.content;
  if (typeof fromOpenAI === "string" && fromOpenAI.length > 0) {
    return fromOpenAI;
  }
  const fromAnthropic = payload.content?.map((part) => part.text ?? "").join("");
  return fromAnthropic !== undefined && fromAnthropic.length > 0 ? fromAnthropic : undefined;
}

async function askModel(log: string, source: string): Promise<string | undefined> {
  const messages: ChatMessage[] = [
    { role: "system", content: AGENT_PROMPT },
    {
      role: "user",
      content: `Jest failure log:\n${log.slice(-12000)}\n\nCurrent ${SERVICE_PATH}:\n${source}`,
    },
  ];

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey !== undefined && openaiKey.length > 0) {
    const answer = await completeChat(
      "https://api.openai.com/v1/chat/completions",
      { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      { model: "gpt-4.1-mini", temperature: 0, messages },
    );
    const file = answer === undefined ? undefined : extractFile(answer);
    if (file !== undefined) {
      return file;
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey !== undefined && anthropicKey.length > 0) {
    const answer = await completeChat(
      "https://api.anthropic.com/v1/messages",
      {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      {
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: AGENT_PROMPT,
        messages: [{ role: "user", content: messages[1].content }],
      },
    );
    const file = answer === undefined ? undefined : extractFile(answer);
    if (file !== undefined) {
      return file;
    }
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken !== undefined && githubToken.length > 0) {
    const answer = await completeChat(
      "https://models.github.ai/inference/chat/completions",
      {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      { model: "openai/gpt-4.1-mini", temperature: 0, messages },
    );
    const file = answer === undefined ? undefined : extractFile(answer);
    if (file !== undefined) {
      return file;
    }
  }

  return undefined;
}

function testsPass(): boolean {
  const result = spawnSync("npm", ["test", "--", "--runInBand"], {
    stdio: "inherit",
    shell: true,
  });
  return result.status === 0;
}

async function main(): Promise<void> {
  const log = readLog();
  const original = readFileSync(SERVICE_PATH, "utf8");
  let patched = false;

  try {
    const fromModel = await askModel(log, original);
    if (fromModel !== undefined) {
      writeFileSync(SERVICE_PATH, fromModel);
      console.log("Applied the model patch. Re-running Jest.");
      patched = testsPass();
      if (!patched) {
        writeFileSync(SERVICE_PATH, original);
      }
    }
  } catch (error: unknown) {
    console.log("Model patch was not usable.", error);
    writeFileSync(SERVICE_PATH, original);
  }

  if (!patched) {
    const repaired = repairOverlap(original, log);
    writeFileSync(SERVICE_PATH, repaired);
    console.log("Applied a log-based overlap repair. Re-running Jest.");
    patched = testsPass();
  }

  if (!patched) {
    writeFileSync(SERVICE_PATH, original);
    throw new Error("The reservation service still fails after the repair attempt");
  }

  writeFileSync(
    "pr-body.md",
    [
      "## Summary",
      "The CI test job failed. This pull request was opened by the auto-heal job, which read test-results.log and patched src/services/reservation.service.ts. The tests were not changed.",
      "",
      "## Agent instruction",
      AGENT_PROMPT,
      "",
      "## Human review",
      "Pending review of the overlap predicate before this patch is accepted.",
      "",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
