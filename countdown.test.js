const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Worker } = require("node:worker_threads");
const { isDirectMention, armReplyTimer, takePendingReply } = require("./countdown");

function message({ content, users, reference = null, repliedUser = null }) {
  return {
    content,
    reference,
    mentions: { users, repliedUser },
  };
}

describe("isDirectMention", () => {
  it("is true when the username is mentioned in a normal message", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(message({ content: "hey <@111> you there", users }), "johnythered"),
      true,
    );
  });

  it("is true for a nickname-style mention in a normal message", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(message({ content: "hey <@!111>", users }), "johnythered"),
      true,
    );
  });

  it("is false when the message only replies to that user", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(
        message({
          content: "just replying",
          users,
          reference: { messageId: "900" },
          repliedUser: users[0],
        }),
        "johnythered",
      ),
      false,
    );
  });

  it("is false when a reply puts the replied user's mention in the text", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(
        message({
          content: "<@111> just replying",
          users,
          reference: { messageId: "900" },
          repliedUser: users[0],
        }),
        "johnythered",
      ),
      false,
    );
  });

  it("is false when a reply is to a message that mentioned the user", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(
        message({
          content: "<@111> replying to the message that mentioned him",
          users,
          reference: { messageId: "901" },
          repliedUser: { id: "222", username: "jory4619" },
        }),
        "johnythered",
      ),
      false,
    );
  });

  it("does not treat a longer id as a match", () => {
    const users = [{ id: "11", username: "johnythered" }];
    assert.equal(
      isDirectMention(message({ content: "hey <@111>", users }), "johnythered"),
      false,
    );
  });
});

describe("takePendingReply", () => {
  it("lets only one caller consume the timer", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "countdown-"));
    const dbPath = path.join(dir, "timeUntilReply");
    armReplyTimer(dbPath, "johnythered", new Date("2026-10-02T14:36:00.000Z"));

    const workerCode = `
      const { workerData, parentPort } = require("node:worker_threads");
      const { takePendingReply } = require(workerData.modulePath);
      parentPort.postMessage(takePendingReply(workerData.dbPath, "johnythered"));
    `;

    const take = () =>
      new Promise((resolve, reject) => {
        const worker = new Worker(workerCode, {
          eval: true,
          workerData: { modulePath: require.resolve("./countdown"), dbPath },
        });
        worker.once("message", resolve);
        worker.once("error", reject);
      });

    const results = await Promise.all([take(), take()]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(takePendingReply(dbPath, "johnythered"), null);
  });
});
