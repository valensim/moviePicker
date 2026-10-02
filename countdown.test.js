const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isDirectMention } = require("./countdown");

function message({ content, users }) {
  return {
    content,
    mentions: { users },
  };
}

describe("isDirectMention", () => {
  it("is true when the username is mentioned in the message text", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(message({ content: "hey <@111> you there", users }), "johnythered"),
      true,
    );
  });

  it("is true for a nickname-style mention in the message text", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(message({ content: "hey <@!111>", users }), "johnythered"),
      true,
    );
  });

  it("is false when the user is only present because this message replies to them", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(message({ content: "just replying", users }), "johnythered"),
      false,
    );
  });

  it("is false when a reply only carries a mention from the message it replies to", () => {
    const users = [{ id: "111", username: "johnythered" }];
    assert.equal(
      isDirectMention(
        message({ content: "replying to the message that mentioned him", users }),
        "johnythered",
      ),
      false,
    );
  });

  it("is true when a reply also contains a direct mention", () => {
    const users = [
      { id: "222", username: "someone" },
      { id: "111", username: "johnythered" },
    ];
    assert.equal(
      isDirectMention(message({ content: "<@222> also <@111>", users }), "johnythered"),
      true,
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
